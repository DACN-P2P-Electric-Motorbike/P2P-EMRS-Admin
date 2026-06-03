import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import FinancialOperations from "../components/ContentMain/FinancialOperations";
import adminService from "../Service/adminService";

vi.mock("../Service/adminService", () => ({
  default: {
    getFinancialQueue: vi.fn(),
    reviewPostTripCharge: vi.fn(),
    captureApprovedCharges: vi.fn(),
    releaseDeposit: vi.fn(),
    createOrRefreshOwnerPayout: vi.fn(),
    updateOwnerPayoutStatus: vi.fn(),
    getBookingClaimSummary: vi.fn(),
  },
}));

describe("FinancialOperations", () => {
  const queueResponse = {
    status: "success",
    data: {
      deposits: [],
      payouts: [],
      charges: [
        {
          id: "charge-1",
          bookingId: "booking-12345678",
          type: "DAMAGE",
          status: "DISPUTED",
          amount: 250000,
          description: "Scratch repair fee",
          evidence: {
            dispute: {
              reason: "The scratch was already present at check-in",
              disputedAt: "2026-05-23T08:00:00.000Z",
              evidenceUrls: ["https://example.com/checkin.jpg"],
            },
          },
        },
      ],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.prompt = vi.fn(() => "Evidence accepted");
    window.alert = vi.fn();
  });

  it("shows dispute evidence and lets admin waive a disputed charge", async () => {
    adminService.getFinancialQueue.mockResolvedValue(queueResponse);
    adminService.reviewPostTripCharge.mockResolvedValue({
      status: "success",
    });

    render(<FinancialOperations />);

    expect(
      await screen.findByText("The scratch was already present at check-in"),
    ).toBeInTheDocument();
    expect(screen.getByText("Bằng chứng 1")).toHaveAttribute(
      "href",
      "https://example.com/checkin.jpg",
    );

    fireEvent.click(screen.getByRole("button", { name: "Miễn phí" }));

    await waitFor(() => {
      expect(adminService.reviewPostTripCharge).toHaveBeenCalledWith(
        "charge-1",
        {
          status: "WAIVED",
          notes: "Evidence accepted",
        },
      );
    });
  });

  it("keeps approved charge capture available", async () => {
    adminService.getFinancialQueue.mockResolvedValue({
      status: "success",
      data: {
        deposits: [],
        payouts: [],
        charges: [
          {
            id: "charge-2",
            bookingId: "booking-approved",
            type: "CLEANING",
            status: "APPROVED",
            amount: 50000,
            description: "Cleaning fee",
          },
        ],
      },
    });
    adminService.captureApprovedCharges.mockResolvedValue({
      status: "success",
    });
    window.confirm = vi.fn(() => true);

    render(<FinancialOperations />);

    fireEvent.click(await screen.findByRole("button", { name: "Khấu trừ" }));

    await waitFor(() => {
      expect(adminService.captureApprovedCharges).toHaveBeenCalledWith(
        "booking-approved",
      );
    });
  });

  it("shows owner evidence and opens booking tracking for charge decisions", async () => {
    adminService.getFinancialQueue.mockResolvedValue({
      status: "success",
      data: {
        deposits: [],
        payouts: [],
        charges: [
          {
            id: "charge-3",
            bookingId: "booking-tracking",
            type: "DAMAGE",
            status: "PENDING_REVIEW",
            amount: 180000,
            description: "Broken mirror",
            evidence: {
              manual: {
                createdAt: "2026-06-03T12:00:00.000Z",
                evidenceUrls: ["https://example.com/owner-checkout.jpg"],
              },
            },
            booking: {
              vehicleId: "vehicle-1",
              ownerId: "owner-1",
              renterId: "renter-1",
            },
          },
        ],
      },
    });
    adminService.getBookingClaimSummary.mockResolvedValue({
      status: "success",
      data: {
        bookingId: "booking-tracking",
        status: "AWAITING_CHARGE_REVIEW",
        totals: {
          pendingChargeAmount: 180000,
          approvedChargeAmount: 0,
          releasableDepositAmount: 320000,
        },
        blockers: [
          {
            code: "UNRESOLVED_POST_TRIP_CHARGES",
            count: 1,
          },
        ],
        nextActions: [
          {
            actor: "ADMIN",
            action: "Review disputed or pending post-trip charges",
          },
        ],
        charges: [
          {
            id: "charge-3",
            type: "DAMAGE",
            status: "PENDING_REVIEW",
            amount: 180000,
            description: "Broken mirror",
          },
        ],
        timeline: [
          {
            type: "POST_TRIP_CHARGE_CREATED",
            occurredAt: "2026-06-03T12:00:00.000Z",
          },
        ],
      },
    });

    render(<FinancialOperations />);

    expect(await screen.findByText("Owner gửi phí")).toBeInTheDocument();
    expect(screen.getByText("Bằng chứng owner 1")).toHaveAttribute(
      "href",
      "https://example.com/owner-checkout.jpg",
    );

    fireEvent.click(screen.getByRole("button", { name: "Xem tracking" }));

    await waitFor(() => {
      expect(adminService.getBookingClaimSummary).toHaveBeenCalledWith(
        "booking-tracking",
      );
    });
    expect(
      await screen.findByText(/Tracking quyết định phí/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Chờ duyệt phí")).toBeInTheDocument();
    expect(screen.getByText("Phí sau chuyến được tạo")).toBeInTheDocument();
  });

  it("lets admin complete a ready owner payout", async () => {
    adminService.getFinancialQueue.mockResolvedValue({
      status: "success",
      data: {
        deposits: [],
        charges: [],
        payouts: [
          {
            id: "payout-1",
            bookingId: "booking-payout",
            status: "PROCESSING",
            ownerRentalAmount: 85000,
            postTripChargeAmount: 40000,
            payoutAmount: 125000,
          },
        ],
      },
    });
    adminService.updateOwnerPayoutStatus.mockResolvedValue({
      status: "success",
    });
    window.prompt = vi
      .fn()
      .mockReturnValueOnce("BANK-TXN-1")
      .mockReturnValueOnce("Paid by bank transfer");

    render(<FinancialOperations />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Hoàn tất payout" }),
    );

    await waitFor(() => {
      expect(adminService.updateOwnerPayoutStatus).toHaveBeenCalledWith(
        "payout-1",
        {
          status: "COMPLETED",
          externalReference: "BANK-TXN-1",
          notes: "Paid by bank transfer",
        },
      );
    });
  });
});

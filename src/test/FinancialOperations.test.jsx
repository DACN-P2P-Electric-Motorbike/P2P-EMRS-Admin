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
  },
}));

describe("FinancialOperations", () => {
  const queueResponse = {
    status: "success",
    data: {
      deposits: [],
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
});

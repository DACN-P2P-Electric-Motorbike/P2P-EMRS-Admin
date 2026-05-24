import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import ClaimCasesQueue from "../components/ContentMain/ClaimCasesQueue";
import adminService from "../Service/adminService";

vi.mock("../Service/adminService", () => ({
  default: {
    getClaimCases: vi.fn(),
    reviewClaimCase: vi.fn(),
  },
}));

describe("ClaimCasesQueue", () => {
  const claimCases = [
    {
      id: "claim-case-1",
      caseNumber: "CLM-1",
      bookingId: "booking-12345678",
      status: "PENDING_SECOND_REVIEW",
      outcome: "OWNER_CLAIM_APPROVED",
      summary: "Damage claim with approved owner evidence.",
      firstDecision: "OWNER_CLAIM_APPROVED",
      firstReviewedAt: "2026-05-24T05:00:00.000Z",
      firstReviewer: { fullName: "Admin One" },
      secondDecision: null,
      secondReviewedAt: null,
      secondReviewer: null,
      sla: {
        status: "OVERDUE",
        stage: "SECOND_REVIEW",
        dueAt: "2026-05-24T07:00:00.000Z",
        remainingMinutes: 0,
        overdueMinutes: 45,
        escalationLevel: 2,
      },
      createdAt: "2026-05-24T04:00:00.000Z",
      booking: {
        renter: { fullName: "Renter One", email: "renter@example.com" },
        owner: { fullName: "Owner One", email: "owner@example.com" },
        vehicle: {
          brand: "VINFAST",
          model: "Klara S",
          licensePlate: "51A-12345",
        },
      },
    },
    {
      id: "claim-case-2",
      caseNumber: "CLM-2",
      bookingId: "booking-22222222",
      status: "APPROVED",
      outcome: "DEPOSIT_RELEASE_APPROVED",
      summary: "Deposit release approved.",
      firstDecision: "DEPOSIT_RELEASE_APPROVED",
      firstReviewedAt: "2026-05-23T05:00:00.000Z",
      firstReviewer: { fullName: "Admin Two" },
      secondDecision: "DEPOSIT_RELEASE_APPROVED",
      secondReviewedAt: "2026-05-23T06:00:00.000Z",
      secondReviewer: { fullName: "Admin Three" },
      sla: {
        status: "COMPLETED",
        stage: "CLOSED",
        dueAt: null,
        remainingMinutes: 0,
        overdueMinutes: 0,
        escalationLevel: 0,
      },
      createdAt: "2026-05-23T04:00:00.000Z",
      booking: {
        renter: { fullName: "Renter Two", email: "renter2@example.com" },
        owner: { fullName: "Owner Two", email: "owner2@example.com" },
        vehicle: {
          brand: "YADEA",
          model: "G5",
          licensePlate: "60-B1 22222",
        },
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    window.prompt = vi.fn(() => "Second review confirmed");
    window.alert = vi.fn();
    adminService.getClaimCases.mockResolvedValue({
      status: "success",
      data: claimCases,
    });
    adminService.reviewClaimCase.mockResolvedValue({
      status: "success",
      data: claimCases[0],
    });
  });

  it("renders claim cases with reviewer and party context", async () => {
    render(<ClaimCasesQueue />);

    expect(await screen.findByText("CLM-1")).toBeInTheDocument();
    expect(
      screen.getByText("Damage claim with approved owner evidence."),
    ).toBeInTheDocument();
    expect(screen.getByText("Renter: Renter One")).toBeInTheDocument();
    expect(screen.getByText(/VINFAST Klara S/)).toBeInTheDocument();
    expect(screen.getByText("Chờ duyệt lần 2")).toBeInTheDocument();
    expect(screen.getAllByText("Quá hạn").length).toBeGreaterThan(0);
    expect(screen.getByText("Trễ 45 phút")).toBeInTheDocument();
    expect(screen.getByText("Case đã có kết luận.")).toBeInTheDocument();
    expect(adminService.getClaimCases).toHaveBeenCalledWith({ limit: 100 });
  });

  it("filters claim cases by status", async () => {
    render(<ClaimCasesQueue />);

    fireEvent.click(await screen.findByRole("button", { name: "Chờ lần 2" }));

    await waitFor(() => {
      expect(adminService.getClaimCases).toHaveBeenLastCalledWith({
        limit: 100,
        status: "PENDING_SECOND_REVIEW",
      });
    });
  });

  it("filters claim cases by SLA status", async () => {
    render(<ClaimCasesQueue />);

    fireEvent.click(await screen.findByRole("button", { name: "Quá hạn" }));

    await waitFor(() => {
      expect(adminService.getClaimCases).toHaveBeenLastCalledWith({
        limit: 100,
        slaStatus: "OVERDUE",
      });
    });
  });

  it("submits a four-eyes review decision from the queue", async () => {
    render(<ClaimCasesQueue />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Duyệt claim owner" }),
    );

    await waitFor(() => {
      expect(adminService.reviewClaimCase).toHaveBeenCalledWith(
        "claim-case-1",
        {
          decision: "OWNER_CLAIM_APPROVED",
          notes: "Second review confirmed",
        },
      );
    });
  });
});

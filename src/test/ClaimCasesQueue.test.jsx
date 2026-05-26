import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import ClaimCasesQueue from "../components/ContentMain/ClaimCasesQueue";
import adminService from "../Service/adminService";

vi.mock("../Service/adminService", () => ({
  default: {
    getClaimCases: vi.fn(),
    getClaimCaseSummary: vi.fn(),
    reviewClaimCase: vi.fn(),
    updateClaimCaseAssignment: vi.fn(),
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
      assignedAdminId: null,
      assignedAt: null,
      assignee: null,
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
      risk: {
        level: "HIGH",
        score: 80,
        indicators: [
          {
            code: "CRITICAL_INCIDENT",
            label: "Critical-severity incident in this claim",
            severity: "HIGH",
          },
          {
            code: "CLAIM_AMOUNT_EXCEEDS_DEPOSIT",
            label: "Open claim amount is at least the held deposit",
            severity: "HIGH",
          },
        ],
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
      assignedAdminId: "admin-three",
      assignedAt: "2026-05-23T04:30:00.000Z",
      assignee: { fullName: "Admin Three", email: "admin3@example.com" },
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
      risk: {
        level: "LOW",
        score: 0,
        indicators: [],
      },
      protectionSettlement: {
        status: "CALCULATED",
        protectionPlan: "PREMIUM",
        eligibleDamageAmount: 4000000,
        nonCoveredChargeAmount: 100000,
        platformCoverageAmount: 3000000,
        renterLiabilityAmount: 1000000,
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
    adminService.getClaimCaseSummary.mockResolvedValue({
      status: "success",
      data: {
        policy: {
          firstReviewHours: 24,
          secondReviewHours: 12,
          atRiskWindowHours: 2,
          highEscalationOverdueHours: 24,
        },
        total: 9,
        active: 7,
        assignedToMe: 3,
        unassigned: 2,
        firstReview: 4,
        secondReview: 3,
        overdue: 2,
        atRisk: 1,
        highRisk: 1,
        mediumRisk: 0,
      },
    });
    adminService.reviewClaimCase.mockResolvedValue({
      status: "success",
      data: claimCases[0],
    });
    adminService.updateClaimCaseAssignment.mockResolvedValue({
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
    expect(screen.getByText("Chưa phân công")).toBeInTheDocument();
    expect(screen.getByText("Admin Three")).toBeInTheDocument();
    expect(screen.getAllByText("Quá hạn").length).toBeGreaterThan(0);
    expect(screen.getByText("Trễ 45 phút")).toBeInTheDocument();
    expect(screen.getByText("Case đã có kết luận.")).toBeInTheDocument();
    expect(screen.getAllByText("Của tôi").length).toBeGreaterThan(0);
    expect(screen.getByText("Chính sách SLA")).toBeInTheDocument();
    expect(screen.getByText(/Lần 1: 24 giờ/)).toBeInTheDocument();
    expect(screen.getByText("Escalation cấp 2")).toBeInTheDocument();
    expect(screen.getAllByText("Rủi ro cao").length).toBeGreaterThan(0);
    expect(screen.getByText("Điểm 80")).toBeInTheDocument();
    expect(
      screen.getByText("Critical-severity incident in this claim"),
    ).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("Phân bổ bảo vệ Premium")).toBeInTheDocument();
    expect(screen.getByText(/Nền tảng hỗ trợ:/)).toBeInTheDocument();
    expect(screen.getByText(/Ngoài bảo vệ:/)).toBeInTheDocument();
    expect(screen.getAllByText("3").length).toBeGreaterThan(0);
    expect(adminService.getClaimCases).toHaveBeenCalledWith({ limit: 100 });
    expect(adminService.getClaimCaseSummary).toHaveBeenCalled();
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

  it("filters claim cases by SLA stage", async () => {
    render(<ClaimCasesQueue />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Review lần 2" }),
    );

    await waitFor(() => {
      expect(adminService.getClaimCases).toHaveBeenLastCalledWith({
        limit: 100,
        slaStage: "SECOND_REVIEW",
      });
    });
  });

  it("filters claim cases by assignment ownership", async () => {
    render(<ClaimCasesQueue />);

    fireEvent.click(await screen.findByRole("button", { name: "Của tôi" }));

    await waitFor(() => {
      expect(adminService.getClaimCases).toHaveBeenLastCalledWith({
        limit: 100,
        assignment: "MINE",
      });
    });
  });

  it("assigns a claim case to the current admin", async () => {
    render(<ClaimCasesQueue />);

    fireEvent.click(
      await screen
        .findAllByRole("button", { name: "Nhận xử lý" })
        .then((buttons) => buttons[0]),
    );

    await waitFor(() => {
      expect(adminService.updateClaimCaseAssignment).toHaveBeenCalledWith(
        "claim-case-1",
        { action: "ASSIGN_SELF" },
      );
    });
  });

  it("bulk assigns selected active claim cases", async () => {
    render(<ClaimCasesQueue />);

    fireEvent.click(await screen.findByLabelText("Chọn tất cả case đang mở"));
    expect(
      await screen.findByText("Đã chọn 1 case đang mở"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Nhận xử lý đã chọn" }));

    await waitFor(() => {
      expect(adminService.updateClaimCaseAssignment).toHaveBeenCalledWith(
        "claim-case-1",
        { action: "ASSIGN_SELF" },
      );
    });
    expect(adminService.updateClaimCaseAssignment).toHaveBeenCalledTimes(1);
  });

  it("bulk submits a review decision for selected active claim cases", async () => {
    render(<ClaimCasesQueue />);

    fireEvent.click(await screen.findByLabelText("Chọn tất cả case đang mở"));
    expect(
      await screen.findByText("Đã chọn 1 case đang mở"),
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByLabelText("Quyết định duyệt các case đã chọn"),
      {
        target: { value: "PAYOUT_RELEASE_APPROVED" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Duyệt đã chọn" }));

    await waitFor(() => {
      expect(adminService.reviewClaimCase).toHaveBeenCalledWith(
        "claim-case-1",
        {
          decision: "PAYOUT_RELEASE_APPROVED",
          notes: "Second review confirmed",
        },
      );
    });
    expect(window.prompt).toHaveBeenCalledWith(
      "Duyệt payout - ghi chú review cho 1 case",
      "",
    );
    expect(adminService.reviewClaimCase).toHaveBeenCalledTimes(1);
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

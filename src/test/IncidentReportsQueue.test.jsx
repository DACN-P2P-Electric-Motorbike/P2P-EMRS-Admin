import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import IncidentReportsQueue from "../components/ContentMain/IncidentReportsQueue";
import adminService from "../Service/adminService";

vi.mock("../Service/adminService", () => ({
  default: {
    getIncidentQueue: vi.fn(),
    getBookingClaimSummary: vi.fn(),
    createEvidenceAnnotation: vi.fn(),
    createOrRefreshClaimCase: vi.fn(),
    reviewClaimCase: vi.fn(),
    reviewIncidentReport: vi.fn(),
  },
}));

describe("IncidentReportsQueue", () => {
  const queueResponse = {
    status: "success",
    data: [
      {
        id: "incident-1",
        bookingId: "booking-12345678",
        category: "DAMAGE",
        severity: "HIGH",
        status: "OPEN",
        description: "Rear panel scratch after checkout",
        createdAt: "2026-05-23T08:00:00.000Z",
        evidence: {
          evidenceUrls: [
            "https://example.com/scratch.jpg",
            "https://example.com/legacy-note.jpg",
          ],
          uploadedEvidence: [
            {
              url: "https://example.com/scratch.jpg",
              uploadedAt: "2026-05-23T07:59:00.000Z",
              serverVerified: true,
            },
          ],
          handoverPhotos: [
            {
              id: "photo-1",
              photoUrl: "https://example.com/checkout.jpg",
              photoType: "rear-panel",
              jointlyConfirmed: true,
            },
          ],
        },
        requiredEvidence: {
          photoRequired: true,
          satisfied: true,
        },
        reporter: {
          fullName: "Renter One",
          email: "renter@example.com",
        },
        booking: {
          renter: { fullName: "Renter One" },
          owner: { fullName: "Owner One" },
          vehicle: {
            brand: "VINFAST",
            model: "Klara S",
            licensePlate: "51A-12345",
            images: ["https://example.com/vehicle.jpg"],
          },
        },
        postTripCharge: {
          type: "DAMAGE",
        },
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.prompt = vi.fn(() => "Evidence reviewed");
    window.alert = vi.fn();
    adminService.getBookingClaimSummary.mockResolvedValue({
      status: "success",
      data: {
        bookingId: "booking-12345678",
        status: "AWAITING_DEPOSIT_DECISION",
        totals: {
          unresolvedIncidentCount: 1,
          pendingChargeAmount: 120000,
          approvedChargeAmount: 0,
          releasableDepositAmount: 380000,
          ownerPayoutAmount: 170000,
        },
        blockers: [
          {
            code: "DEPOSIT_DECISION_PENDING",
            count: 1,
            label: "Deposit ledger is DISPUTED",
          },
        ],
        nextActions: [
          {
            actor: "ADMIN",
            action: "Capture approved charges or waive them",
          },
        ],
        timeline: [
          {
            type: "INCIDENT_CREATED",
            occurredAt: "2026-05-23T08:00:00.000Z",
          },
        ],
        incidents: [
          {
            id: "incident-1",
            category: "DAMAGE",
            evidence: {
              handoverPhotos: [
                {
                  id: "photo-1",
                  photoType: "rear-panel",
                },
              ],
            },
          },
        ],
        charges: [
          {
            id: "charge-1",
            type: "DAMAGE",
          },
        ],
        evidenceAnnotations: [
          {
            id: "annotation-1",
            targetType: "INCIDENT_REPORT",
            targetId: "incident-1",
            note: "Ảnh checkout khớp báo cáo xước.",
            tags: ["damage"],
            createdAt: "2026-05-24T08:00:00.000Z",
            author: { fullName: "Admin One" },
          },
        ],
        claimCase: null,
      },
    });
    adminService.createOrRefreshClaimCase.mockResolvedValue({
      id: "claim-case-1",
    });
    adminService.reviewClaimCase.mockResolvedValue({ id: "claim-case-1" });
    adminService.createEvidenceAnnotation.mockResolvedValue({
      id: "annotation-2",
    });
  });

  it("renders incident evidence and lets admin move a report under review", async () => {
    adminService.getIncidentQueue.mockResolvedValue(queueResponse);
    adminService.reviewIncidentReport.mockResolvedValue({ status: "success" });

    render(<IncidentReportsQueue />);

    expect(
      await screen.findByText("Rear panel scratch after checkout"),
    ).toBeInTheDocument();
    expect(screen.getByText("Hư hại")).toBeInTheDocument();
    expect(screen.getByText("51A-12345")).toBeInTheDocument();
    expect(screen.getByText("File 1")).toHaveAttribute(
      "href",
      "https://example.com/scratch.jpg",
    );
    expect(screen.getByText("rear-panel")).toHaveAttribute(
      "href",
      "https://example.com/checkout.jpg",
    );
    expect(screen.getByText("API xác thực upload")).toBeInTheDocument();
    expect(screen.getByText("URL chưa có receipt")).toBeInTheDocument();
    expect(screen.getByText("Hai bên xác nhận")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Đang xem" }));

    await waitFor(() => {
      expect(adminService.reviewIncidentReport).toHaveBeenCalledWith(
        "incident-1",
        {
          status: "UNDER_REVIEW",
          adminNotes: "Evidence reviewed",
        },
      );
    });
  });

  it("reloads the incident queue when refreshed", async () => {
    adminService.getIncidentQueue.mockResolvedValue(queueResponse);

    render(<IncidentReportsQueue />);

    fireEvent.click(await screen.findByRole("button", { name: "Làm mới" }));

    await waitFor(() => {
      expect(adminService.getIncidentQueue).toHaveBeenCalledTimes(2);
    });
  });

  it("opens the unified booking claim summary from an incident row", async () => {
    adminService.getIncidentQueue.mockResolvedValue(queueResponse);

    render(<IncidentReportsQueue />);

    fireEvent.click(await screen.findByRole("button", { name: "Xem claim" }));

    await waitFor(() => {
      expect(adminService.getBookingClaimSummary).toHaveBeenCalledWith(
        "booking-12345678",
      );
    });
    expect(
      await screen.findByText("Hồ sơ claim #booking-"),
    ).toBeInTheDocument();
    expect(screen.getByText("Chờ quyết định cọc")).toBeInTheDocument();
    expect(
      screen.getByText("Tiền cọc đang chờ quyết định"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Ảnh checkout khớp báo cáo xước."),
    ).toBeInTheDocument();
  });

  it("adds an evidence annotation from the claim dossier", async () => {
    adminService.getIncidentQueue.mockResolvedValue(queueResponse);

    render(<IncidentReportsQueue />);

    fireEvent.click(await screen.findByRole("button", { name: "Xem claim" }));
    fireEvent.change(await screen.findByLabelText("Ghi chú"), {
      target: { value: "Photo confirms checkout-side damage" },
    });
    fireEvent.change(screen.getByLabelText("Tag"), {
      target: { value: "damage, checkout" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu ghi chú" }));

    await waitFor(() => {
      expect(adminService.createEvidenceAnnotation).toHaveBeenCalledWith(
        "booking-12345678",
        expect.objectContaining({
          targetType: "INCIDENT_REPORT",
          targetId: "incident-1",
          note: "Photo confirms checkout-side damage",
          tags: ["damage", "checkout"],
        }),
      );
    });
    expect(adminService.getBookingClaimSummary).toHaveBeenCalledTimes(2);
  });

  it("creates a durable claim case from the dossier", async () => {
    adminService.getIncidentQueue.mockResolvedValue(queueResponse);

    render(<IncidentReportsQueue />);

    fireEvent.click(await screen.findByRole("button", { name: "Xem claim" }));
    fireEvent.click(await screen.findByRole("button", { name: "Tạo case" }));

    await waitFor(() => {
      expect(adminService.createOrRefreshClaimCase).toHaveBeenCalledWith(
        "booking-12345678",
      );
    });
  });

  it("submits a four-eyes claim case review decision", async () => {
    adminService.getIncidentQueue.mockResolvedValue(queueResponse);
    adminService.getBookingClaimSummary.mockResolvedValue({
      status: "success",
      data: {
        bookingId: "booking-12345678",
        status: "UNDER_REVIEW",
        totals: {},
        blockers: [],
        nextActions: [],
        timeline: [],
        claimCase: {
          id: "claim-case-1",
          bookingId: "booking-12345678",
          caseNumber: "CLM-1",
          status: "OPEN",
          summary: "1 incident",
          risk: {
            level: "MEDIUM",
            score: 45,
            indicators: [
              {
                code: "HIGH_SEVERITY_INCIDENT",
                label: "High-severity incident in this claim",
                severity: "MEDIUM",
              },
            ],
          },
          protectionSettlement: {
            status: "CALCULATED",
            protectionPlan: "PREMIUM",
            eligibleDamageAmount: 4000000,
            nonCoveredChargeAmount: 100000,
            deductibleAppliedAmount: 500000,
            platformCoverageAmount: 3000000,
            renterLiabilityAmount: 1000000,
            excessAboveCoverageAmount: 500000,
          },
        },
      },
    });

    render(<IncidentReportsQueue />);

    fireEvent.click(await screen.findByRole("button", { name: "Xem claim" }));
    expect(await screen.findByText("Rủi ro vừa")).toBeInTheDocument();
    expect(screen.getByText("Điểm rủi ro 45")).toBeInTheDocument();
    expect(
      screen.getByText("High-severity incident in this claim"),
    ).toBeInTheDocument();
    expect(screen.getByText("Phân bổ gói bảo vệ Premium")).toBeInTheDocument();
    expect(screen.getByText(/Vượt hạn mức:/)).toBeInTheDocument();
    expect(
      screen.getByText(
        "Phân bổ nội bộ; không xác nhận giao dịch cổng thanh toán.",
      ),
    ).toBeInTheDocument();
    fireEvent.click(
      await screen.findByRole("button", { name: "Duyệt claim owner" }),
    );

    await waitFor(() => {
      expect(adminService.reviewClaimCase).toHaveBeenCalledWith(
        "claim-case-1",
        {
          decision: "OWNER_CLAIM_APPROVED",
          notes: "Evidence reviewed",
        },
      );
    });
  });
});

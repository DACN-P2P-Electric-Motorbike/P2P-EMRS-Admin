import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import KycReviewQueue from "../components/ContentMain/KycReviewQueue";
import adminService from "../Service/adminService";

vi.mock("../Service/adminService", () => ({
  default: {
    getKycSubmissions: vi.fn(),
    reviewKycSubmission: vi.fn(),
  },
}));

describe("KycReviewQueue", () => {
  const pendingResponse = {
    status: "success",
    data: {
      data: [
        {
          id: "kyc-1",
          userId: "user-1",
          selfieUrl: "https://example.com/selfie.jpg",
          idCardFrontUrl: "https://example.com/front.jpg",
          idCardBackUrl: "https://example.com/back.jpg",
          status: "PENDING",
          rejectionReason: null,
          reviewedAt: null,
          createdAt: "2026-05-23T07:00:00.000Z",
          updatedAt: "2026-05-23T08:00:00.000Z",
          user: {
            id: "user-1",
            fullName: "Nguyen Van A",
            email: "a@example.com",
            phone: "0909000000",
            trustScore: 105,
          },
        },
      ],
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
    window.prompt = vi.fn(() => "Ảnh CCCD bị mờ");
    window.alert = vi.fn();
  });

  it("loads pending KYC submissions and approves one", async () => {
    adminService.getKycSubmissions.mockResolvedValue(pendingResponse);
    adminService.reviewKycSubmission.mockResolvedValue({ status: "success" });

    render(<KycReviewQueue />);

    expect(await screen.findByText("Nguyen Van A")).toBeInTheDocument();
    expect(screen.getByText("a@example.com")).toBeInTheDocument();
    expect(screen.getByText("Selfie").closest("a")).toHaveAttribute(
      "href",
      "https://example.com/selfie.jpg",
    );

    fireEvent.click(screen.getByRole("button", { name: "Duyệt" }));

    await waitFor(() => {
      expect(adminService.reviewKycSubmission).toHaveBeenCalledWith("kyc-1", {
        status: "APPROVED",
      });
    });
  });

  it("requires and submits a rejection reason", async () => {
    adminService.getKycSubmissions.mockResolvedValue(pendingResponse);
    adminService.reviewKycSubmission.mockResolvedValue({ status: "success" });

    render(<KycReviewQueue />);

    fireEvent.click(await screen.findByRole("button", { name: "Từ chối" }));

    await waitFor(() => {
      expect(adminService.reviewKycSubmission).toHaveBeenCalledWith("kyc-1", {
        status: "REJECTED",
        rejectionReason: "Ảnh CCCD bị mờ",
      });
    });
  });

  it("filters submissions by selected status", async () => {
    adminService.getKycSubmissions.mockResolvedValue(pendingResponse);

    render(<KycReviewQueue />);

    fireEvent.change(await screen.findByRole("combobox"), {
      target: { value: "APPROVED" },
    });

    await waitFor(() => {
      expect(adminService.getKycSubmissions).toHaveBeenCalledWith({
        status: "APPROVED",
        page: 1,
        limit: 10,
      });
    });
  });
});

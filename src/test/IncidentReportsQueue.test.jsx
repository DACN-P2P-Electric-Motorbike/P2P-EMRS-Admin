import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import IncidentReportsQueue from "../components/ContentMain/IncidentReportsQueue";
import adminService from "../Service/adminService";

vi.mock("../Service/adminService", () => ({
  default: {
    getIncidentQueue: vi.fn(),
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
          evidenceUrls: ["https://example.com/scratch.jpg"],
          handoverPhotos: [
            {
              id: "photo-1",
              photoUrl: "https://example.com/checkout.jpg",
              photoType: "rear-panel",
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
});

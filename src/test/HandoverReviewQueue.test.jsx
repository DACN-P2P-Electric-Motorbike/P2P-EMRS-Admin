import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import HandoverReviewQueue from "../components/ContentMain/HandoverReviewQueue";
import adminService from "../Service/adminService";

vi.mock("../Service/adminService", () => ({
  default: {
    getHandoverReviewQueue: vi.fn(),
  },
}));

describe("HandoverReviewQueue", () => {
  const queueResponse = {
    status: "success",
    data: [
      {
        booking: {
          id: "booking-12345678",
          status: "COMPLETED",
          startTime: "2026-05-23T08:00:00.000Z",
          endTime: "2026-05-23T10:00:00.000Z",
          renter: {
            fullName: "Renter One",
            email: "renter@example.com",
          },
          owner: {
            fullName: "Owner One",
            email: "owner@example.com",
          },
          vehicle: {
            brand: "VINFAST",
            model: "Klara S",
            licensePlate: "51A-12345",
            images: ["https://example.com/vehicle.jpg"],
          },
        },
        handover: {
          bookingId: "booking-12345678",
          checkIn: {
            id: "checkin-1",
            type: "CHECK_IN",
            odometerReading: 1200,
            batteryLevel: 90,
            confirmedByOwner: true,
            confirmedByRenter: true,
            isComplete: true,
            notes: "Clean at pickup",
            photos: [
              {
                id: "photo-1",
                photoUrl: "https://example.com/checkin.jpg",
                photoType: "front",
              },
            ],
          },
          checkOut: {
            id: "checkout-1",
            type: "CHECK_OUT",
            odometerReading: 1260,
            batteryLevel: 50,
            confirmedByOwner: true,
            confirmedByRenter: false,
            isComplete: false,
            notes: "New scratch reported",
            photos: [
              {
                id: "photo-2",
                photoUrl: "https://example.com/checkout.jpg",
                photoType: "right-side",
              },
            ],
          },
          differences: {
            kmDriven: 60,
            batteryDelta: -40,
          },
        },
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders handover evidence and missing-signature state", async () => {
    adminService.getHandoverReviewQueue.mockResolvedValue(queueResponse);

    render(<HandoverReviewQueue />);

    expect(await screen.findByText("#booking-")).toBeInTheDocument();
    expect(screen.getByText(/VINFAST/)).toBeInTheDocument();
    expect(screen.getByText("51A-12345")).toBeInTheDocument();
    expect(screen.getByText("Renter: Renter One")).toBeInTheDocument();
    expect(screen.getByText("New scratch reported")).toBeInTheDocument();
    expect(screen.getAllByText("Thiếu chữ ký").length).toBeGreaterThan(0);
    expect(screen.getByText("front")).toHaveAttribute(
      "href",
      "https://example.com/checkin.jpg",
    );
    expect(screen.getByText(/Quãng đường:/)).toHaveTextContent("60 km");
    expect(
      screen
        .getAllByText(/Pin:/)
        .some((element) => element.textContent?.includes("-40%")),
    ).toBe(true);
  });

  it("reloads the queue when refreshed", async () => {
    adminService.getHandoverReviewQueue.mockResolvedValue(queueResponse);

    render(<HandoverReviewQueue />);

    fireEvent.click(await screen.findByRole("button", { name: "Làm mới" }));

    await waitFor(() => {
      expect(adminService.getHandoverReviewQueue).toHaveBeenCalledTimes(2);
    });
  });
});

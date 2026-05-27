import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ApproveVehicles from '../components/ContentMain/ApproveVehicles';
import adminService from '../Service/adminService';

// 1. Mock adminService cập nhật thêm hàm getUserTrustScore
vi.mock('../Service/adminService', () => ({
  default: {
    getVehicles: vi.fn(),
    updateVehicleStatus: vi.fn(),
    getUserTrustScore: vi.fn(),
  }
}));

describe('ApproveVehicles Component (UC-10)', () => {
  // Dữ liệu mẫu khớp với cấu trúc API danh sách xe
  const mockVehicleData = {
    status: "success",
    data: {
      data: [
        {
          id: 'd34d5217-57c2-49a0-906c-1be9c6db174e',
          created_at: "2026-03-03T06:35:41.723Z",
          vehicle_info: {
            brand: "VINFAST",
            model: "Klara S",
            plate_number: "51A-99887",
            images: ["https://example.com/klara.jpg"],
            first_registration_year: 2024,
            condition: "GOOD",
            battery_type: "REMOVABLE",
            battery_health: 92,
            battery_cycle_count: 180,
            battery_last_serviced_at: "2026-05-01T00:00:00.000Z"
          },
          owner: { id: 'owner-123', full_name: "Momo Owner", email: "momo@test.com" },
          status: "PENDING_APPROVAL"
        }
      ],
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
    }
  };

  // Dữ liệu mẫu khớp với cấu trúc API Trust Score trong mã nguồn
  const mockTrustScoreData = {
    status: "success",
    data: {
      trustScore: 85,
      status: "TỐT",
      tier: {
        level: "VÀNG",
        label: "Thành viên đáng tin cậy",
        canRegisterVehicle: true,
        maxConcurrentBookings: 3
      },
      recentEvents: [
        {
          id: "event-1",
          reason: "Hoàn thành chuyến đi đúng giờ",
          delta: 2.5,
          scoreBefore: 82.5,
          scoreAfter: 85,
          createdAt: "2026-05-20T10:00:00.000Z",
          metadata: {
            kycScore: 20,
            ratingScore: 4.8,
            activityScore: 15,
            punctualityScore: 95,
            disputeRate: 0
          }
        }
      ]
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Giả lập các tương tác cửa sổ hệ thống
    window.confirm = vi.fn(() => true);
    window.alert = vi.fn();
  });

  it('Phải hiển thị trạng thái đang tải và sau đó hiện danh sách xe', async () => {
    adminService.getVehicles.mockResolvedValue(mockVehicleData);

    render(<ApproveVehicles />);

    expect(screen.getByText(/Đang tải danh sách xe/i)).toBeInTheDocument();

    const brand = await screen.findByText('VINFAST');
    expect(brand).toBeInTheDocument();
    expect(screen.getByText('51A-99887')).toBeInTheDocument();
    expect(screen.getByText('Momo Owner')).toBeInTheDocument();
  });

  it('Phải gọi API updateVehicleStatus khi nhấn Duyệt', async () => {
    adminService.getVehicles.mockResolvedValue(mockVehicleData);
    adminService.updateVehicleStatus.mockResolvedValue({ status: 'success' });

    render(<ApproveVehicles />);

    const approveBtn = await screen.findByRole('button', { name: /Duyệt/i });
    
    await act(async () => {
      fireEvent.click(approveBtn);
    });

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining("PHÊ DUYỆT"));
    expect(adminService.updateVehicleStatus).toHaveBeenCalledWith('d34d5217-57c2-49a0-906c-1be9c6db174e', 'AVAILABLE');
    expect(window.alert).toHaveBeenCalledWith("Đã duyệt xe thành công!");
  });

  it('Phải gọi API updateVehicleStatus khi nhấn Từ chối', async () => {
    adminService.getVehicles.mockResolvedValue(mockVehicleData);
    adminService.updateVehicleStatus.mockResolvedValue({ status: 'success' });

    render(<ApproveVehicles />);

    const rejectBtn = await screen.findByRole('button', { name: /Từ chối/i });
    
    await act(async () => {
      fireEvent.click(rejectBtn);
    });

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining("TỪ CHỐI"));
    expect(adminService.updateVehicleStatus).toHaveBeenCalledWith('d34d5217-57c2-49a0-906c-1be9c6db174e', 'REJECTED');
    expect(window.alert).toHaveBeenCalledWith("Đã từ chối xe.");
  });

  it('Phải thay đổi tham số lọc khi chọn trạng thái khác', async () => {
    adminService.getVehicles.mockResolvedValue(mockVehicleData);
    
    render(<ApproveVehicles />);

    const filterSelect = screen.getByRole('combobox');
    
    await act(async () => {
      fireEvent.change(filterSelect, { target: { value: 'AVAILABLE' } });
    });

    expect(adminService.getVehicles).toHaveBeenCalledWith(expect.objectContaining({
      status: 'AVAILABLE',
      page: 1
    }));
  });

  it('Phải xử lý chuyển trang chính xác', async () => {
    adminService.getVehicles.mockResolvedValue({
      ...mockVehicleData,
      data: { ...mockVehicleData.data, pagination: { ...mockVehicleData.data.pagination, totalPages: 2 } }
    });

    render(<ApproveVehicles />);

    const nextBtn = await screen.findByRole('button', { name: /Sau/i });
    
    await act(async () => {
      fireEvent.click(nextBtn);
    });

    expect(adminService.getVehicles).toHaveBeenCalledWith(expect.objectContaining({
      page: 2
    }));
  });

  // ================= CÁC TEST CASE BỔ SUNG THEO COMPONENT MỚI =================

  it('Phải mở và đóng được Modal chi tiết xe', async () => {
    adminService.getVehicles.mockResolvedValue(mockVehicleData);

    render(<ApproveVehicles />);

    // Tìm nút mở chi tiết xe
    const detailBtn = await screen.findByRole('button', { name: /Chi tiết xe/i });
    
    await act(async () => {
      fireEvent.click(detailBtn);
    });

    // Xác nhận tiêu đề Modal xuất hiện cùng thông số đã được map nhãn (Label labels)
    expect(screen.getByText('Chi tiết phương tiện')).toBeInTheDocument();
    expect(screen.getByText('Tình trạng:')).toBeInTheDocument();
    expect(screen.getByText('Tốt')).toBeInTheDocument(); // GOOD chuyển thành Tốt
    expect(screen.getByText('Pin tháo rời')).toBeInTheDocument(); // REMOVABLE chuyển thành Pin tháo rời
    expect(screen.getByText('180 lần')).toBeInTheDocument();

    // Test tính năng đóng modal bằng nút đóng (X hoặc Đóng)
    const closeBtn = screen.getByRole('button', { name: /Đóng/i });
    await act(async () => {
      fireEvent.click(closeBtn);
    });

    // Modal biến mất khỏi DOM
    expect(screen.queryByText('Chi tiết phương tiện')).not.toBeInTheDocument();
  });

  it('Phải hiển thị Hồ sơ uy tín (Trust Score) khi nhấn vào nút Chủ xe (Score)', async () => {
    adminService.getVehicles.mockResolvedValue(mockVehicleData);
    adminService.getUserTrustScore.mockResolvedValue(mockTrustScoreData);

    render(<ApproveVehicles />);

    const trustScoreBtn = await screen.findByRole('button', { name: /Chủ xe \(Score\)/i });
    
    await act(async () => {
      fireEvent.click(trustScoreBtn);
    });

    // Kiểm tra API được gọi đúng Owner ID
    expect(adminService.getUserTrustScore).toHaveBeenCalledWith('owner-123');

    // Kiểm tra dữ liệu modal hiển thị chính xác
    expect(screen.getByText('Hồ sơ uy tín thành viên')).toBeInTheDocument();
    expect(screen.getByText(/Chủ xe:/i)).toHaveTextContent('Momo Owner');
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('Hạng VÀNG: Thành viên đáng tin cậy')).toBeInTheDocument();
    expect(screen.getByText('Hoàn thành chuyến đi đúng giờ')).toBeInTheDocument();
    expect(screen.getByText('+2.5')).toBeInTheDocument();
    
    // Kiểm tra metadata chi tiết trong lịch sử biến động điểm
    expect(screen.getByText(/KYC:/i)).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();

    // Đóng Modal hồ sơ uy tín
    const closeBtn = screen.getByRole('button', { name: /Đóng/i });
    await act(async () => {
      fireEvent.click(closeBtn);
    });

    expect(screen.queryByText('Hồ sơ uy tín thành viên')).not.toBeInTheDocument();
  });
});
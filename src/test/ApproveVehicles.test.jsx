import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ApproveVehicles from '../components/ContentMain/ApproveVehicles';
import adminService from '../Service/adminService';

// 1. Mock adminService theo đúng cấu trúc export default
vi.mock('../Service/adminService', () => ({
  default: {
    getVehicles: vi.fn(),
    updateVehicleStatus: vi.fn(),
  }
}));

describe('ApproveVehicles Component (UC-10)', () => {
  // Dữ liệu mẫu khớp với cấu trúc API trong mã nguồn
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
            images: ["https://example.com/klara.jpg"]
          },
          owner: { full_name: "Momo Owner", email: "momo@test.com" },
          status: "PENDING_APPROVAL"
        }
      ],
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Giả lập window.confirm mặc định trả về true
    window.confirm = vi.fn(() => true);
    window.alert = vi.fn();
  });

  it('Phải hiển thị trạng thái đang tải và sau đó hiện danh sách xe', async () => {
    adminService.getVehicles.mockResolvedValue(mockVehicleData);

    render(<ApproveVehicles />);

    // Kiểm tra trạng thái loading ban đầu
    expect(screen.getByText(/Đang tải danh sách xe/i)).toBeInTheDocument();

    // Đợi dữ liệu hiển thị (findBy xử lý ngầm act() giúp tránh warning)
    const brand = await screen.findByText('VINFAST');
    expect(brand).toBeInTheDocument();
    expect(screen.getByText('51A-99887')).toBeInTheDocument();
  });

  it('Phải gọi API updateVehicleStatus khi nhấn Duyệt', async () => {
    adminService.getVehicles.mockResolvedValue(mockVehicleData);
    adminService.updateVehicleStatus.mockResolvedValue({ status: 'success' });

    render(<ApproveVehicles />);

    // Tìm và nhấn nút Duyệt
    const approveBtn = await screen.findByRole('button', { name: /Duyệt/i });
    
    await act(async () => {
      fireEvent.click(approveBtn);
    });

    // Kiểm tra xác nhận và gọi API
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining("PHÊ DUYỆT"));
    expect(adminService.updateVehicleStatus).toHaveBeenCalledWith('d34d5217-57c2-49a0-906c-1be9c6db174e', 'AVAILABLE');
  });

  it('Phải gọi API updateVehicleStatus khi nhấn Từ chối', async () => {
    adminService.getVehicles.mockResolvedValue(mockVehicleData);
    adminService.updateVehicleStatus.mockResolvedValue({ status: 'success' });

    render(<ApproveVehicles />);

    const rejectBtn = await screen.findByRole('button', { name: /Từ chối/i });
    
    await act(async () => {
      fireEvent.click(rejectBtn);
    });

    // Kiểm tra gọi API từ chối
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining("TỪ CHỐI"));
    expect(adminService.updateVehicleStatus).toHaveBeenCalledWith('d34d5217-57c2-49a0-906c-1be9c6db174e', 'REJECTED');
  });

  it('Phải thay đổi tham số lọc khi chọn trạng thái khác', async () => {
    adminService.getVehicles.mockResolvedValue(mockVehicleData);
    
    render(<ApproveVehicles />);

    const filterSelect = screen.getByRole('combobox');
    
    await act(async () => {
      fireEvent.change(filterSelect, { target: { value: 'AVAILABLE' } });
    });

    // Kiểm tra xem API có được gọi lại với status mới không
    expect(adminService.getVehicles).toHaveBeenCalledWith(expect.objectContaining({
      status: 'AVAILABLE',
      page: 1
    }));
  });

  it('Phải xử lý chuyển trang chính xác', async () => {
    // Mock dữ liệu có 2 trang
    adminService.getVehicles.mockResolvedValue({
      ...mockVehicleData,
      data: { ...mockVehicleData.data, pagination: { ...mockVehicleData.data.pagination, totalPages: 2 } }
    });

    render(<ApproveVehicles />);

    const nextBtn = await screen.findByRole('button', { name: /Sau/i });
    
    await act(async () => {
      fireEvent.click(nextBtn);
    });

    // Kiểm tra page tăng lên 2
    expect(adminService.getVehicles).toHaveBeenCalledWith(expect.objectContaining({
      page: 2
    }));
  });
});
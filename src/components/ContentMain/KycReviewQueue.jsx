import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import adminService from "../../Service/adminService";

const statusClass = {
  PENDING: "bg-yellow-500/10 text-yellow-300",
  APPROVED: "bg-green-500/10 text-green-300",
  REJECTED: "bg-red-500/10 text-red-300",
};

const statusLabel = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Đã từ chối",
};

const formatDateTime = (value) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value))
    : "-";

const StatusPill = ({ value }) => (
  <span
    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${statusClass[value] || "bg-white/10 text-white"}`}
  >
    {statusLabel[value] || value}
  </span>
);

const DocumentLink = ({ href, label }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="group block overflow-hidden rounded-lg border border-white/10 bg-black/20 hover:border-pumpkin/70"
  >
    <img
      src={href}
      alt={label}
      className="h-20 w-28 object-cover transition-transform group-hover:scale-105"
    />
    <span className="block px-2 py-1 text-center text-[10px] font-semibold text-gray-300">
      {label}
    </span>
  </a>
);

StatusPill.propTypes = {
  value: PropTypes.string.isRequired,
};

DocumentLink.propTypes = {
  href: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};

const KycReviewQueue = () => {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    status: "PENDING",
    page: 1,
    limit: 10,
  });

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page: filters.page,
        limit: filters.limit,
      };
      if (filters.status) params.status = filters.status;

      const result = await adminService.getKycSubmissions(params);
      setItems(result.data?.data || []);
      setPagination(result.data?.pagination || {});
    } catch (err) {
      setError(err.message || "Không thể tải hàng chờ KYC");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const totals = useMemo(
    () => ({
      pending: items.filter((item) => item.status === "PENDING").length,
      approved: items.filter((item) => item.status === "APPROVED").length,
      rejected: items.filter((item) => item.status === "REJECTED").length,
    }),
    [items],
  );

  const updateStatusFilter = (status) => {
    setFilters((current) => ({
      ...current,
      status,
      page: 1,
    }));
  };

  const reviewSubmission = async (item, status) => {
    let rejectionReason;
    if (status === "APPROVED") {
      if (!window.confirm("Phê duyệt hồ sơ KYC này?")) return;
    } else {
      rejectionReason = window.prompt("Lý do từ chối hồ sơ KYC", "");
      if (rejectionReason === null) return;
      rejectionReason = rejectionReason.trim();
      if (!rejectionReason) {
        window.alert("Vui lòng nhập lý do từ chối.");
        return;
      }
    }

    setBusyId(item.id);
    try {
      await adminService.reviewKycSubmission(item.id, {
        status,
        ...(rejectionReason ? { rejectionReason } : {}),
      });
      await loadSubmissions();
    } catch (err) {
      window.alert(err.message || "Không thể cập nhật KYC");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-6 text-white min-h-screen">
      <div className="flex flex-wrap justify-between gap-4 items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-wider">
            Duyệt KYC
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Kiểm tra selfie, CCCD và phê duyệt xác minh người dùng.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={filters.status}
            onChange={(event) => updateStatusFilter(event.target.value)}
            className="bg-primary border border-white/10 text-white rounded-lg px-4 py-2 outline-none focus:border-pumpkin text-sm"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REJECTED">Đã từ chối</option>
          </select>
          <button
            onClick={loadSubmissions}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold"
          >
            Làm mới
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-primary border border-white/5 rounded-xl p-5">
          <p className="text-gray-400 text-xs uppercase tracking-widest">
            Chờ duyệt trong trang
          </p>
          <p className="text-2xl font-bold mt-2">{totals.pending}</p>
        </div>
        <div className="bg-primary border border-white/5 rounded-xl p-5">
          <p className="text-gray-400 text-xs uppercase tracking-widest">
            Đã duyệt trong trang
          </p>
          <p className="text-2xl font-bold mt-2">{totals.approved}</p>
        </div>
        <div className="bg-primary border border-white/5 rounded-xl p-5">
          <p className="text-gray-400 text-xs uppercase tracking-widest">
            Đã từ chối trong trang
          </p>
          <p className="text-2xl font-bold mt-2">{totals.rejected}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-white">
          <div className="w-10 h-10 border-4 border-pumpkin/20 border-t-pumpkin rounded-full animate-spin mb-4"></div>
          <p>Đang tải hàng chờ KYC...</p>
        </div>
      ) : (
        <section className="bg-primary rounded-xl border border-white/5 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1120px]">
              <thead>
                <tr className="text-gray-400 border-b border-white/5 text-xs uppercase tracking-widest">
                  <th className="p-5">Người dùng</th>
                  <th className="p-5">Trạng thái</th>
                  <th className="p-5">Tài liệu</th>
                  <th className="p-5">Gửi lúc</th>
                  <th className="p-5">Ghi chú</th>
                  <th className="p-5">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? (
                  items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-white/5 hover:bg-white/5"
                    >
                      <td className="p-5">
                        <p className="font-semibold">
                          {item.user?.fullName || item.userId}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {item.user?.email || "-"}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          SĐT: {item.user?.phone || "-"} · Trust:{" "}
                          {item.user?.trustScore ?? "-"}
                        </p>
                      </td>
                      <td className="p-5">
                        <StatusPill value={item.status} />
                      </td>
                      <td className="p-5">
                        <div className="flex gap-3">
                          <DocumentLink href={item.selfieUrl} label="Selfie" />
                          <DocumentLink
                            href={item.idCardFrontUrl}
                            label="CCCD trước"
                          />
                          <DocumentLink
                            href={item.idCardBackUrl}
                            label="CCCD sau"
                          />
                        </div>
                      </td>
                      <td className="p-5 text-sm text-gray-300">
                        {formatDateTime(item.updatedAt || item.createdAt)}
                      </td>
                      <td className="p-5 text-sm text-gray-300 max-w-[260px]">
                        {item.status === "REJECTED" ? (
                          item.rejectionReason || "Không có lý do từ chối"
                        ) : item.reviewedAt ? (
                          <>Duyệt lúc {formatDateTime(item.reviewedAt)}</>
                        ) : (
                          "Chưa xử lý"
                        )}
                      </td>
                      <td className="p-5">
                        {item.status === "PENDING" ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              disabled={busyId === item.id}
                              onClick={() =>
                                reviewSubmission(item, "APPROVED")
                              }
                              className="px-3 py-1.5 rounded-md bg-green-500/20 text-green-300 hover:bg-green-500 hover:text-white text-xs font-bold"
                            >
                              Duyệt
                            </button>
                            <button
                              disabled={busyId === item.id}
                              onClick={() =>
                                reviewSubmission(item, "REJECTED")
                              }
                              className="px-3 py-1.5 rounded-md bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white text-xs font-bold"
                            >
                              Từ chối
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">
                            Đã xử lý
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="p-10 text-center text-gray-500 italic"
                    >
                      Không có hồ sơ KYC phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-5 flex justify-between items-center border-t border-white/5 bg-black/10">
            <span className="text-xs text-gray-500">
              Tổng số: {pagination.total || 0} hồ sơ
            </span>
            <div className="flex gap-2">
              <button
                disabled={filters.page === 1}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: current.page - 1,
                  }))
                }
                className="px-4 py-2 bg-white/5 rounded-lg disabled:opacity-20 text-sm hover:bg-white/10"
              >
                Trước
              </button>
              <span className="flex items-center px-4 text-pumpkin font-bold text-sm">
                Trang {pagination.page || 1} / {pagination.totalPages || 1}
              </span>
              <button
                disabled={filters.page === (pagination.totalPages || 1)}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: current.page + 1,
                  }))
                }
                className="px-4 py-2 bg-white/5 rounded-lg disabled:opacity-20 text-sm hover:bg-white/10"
              >
                Sau
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default KycReviewQueue;

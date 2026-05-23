import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import adminService from "../../Service/adminService";

const money = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const statusClass = {
  HELD: "bg-blue-500/10 text-blue-300",
  PENDING_CHARGES: "bg-yellow-500/10 text-yellow-300",
  PARTIALLY_CAPTURED: "bg-orange-500/10 text-orange-300",
  CAPTURED: "bg-red-500/10 text-red-300",
  RELEASE_PENDING: "bg-green-500/10 text-green-300",
  RELEASED: "bg-emerald-500/10 text-emerald-300",
  DISPUTED: "bg-purple-500/10 text-purple-300",
  PENDING_REVIEW: "bg-yellow-500/10 text-yellow-300",
  APPROVED: "bg-blue-500/10 text-blue-300",
  WAIVED: "bg-gray-500/10 text-gray-300",
  DEDUCTED_FROM_DEPOSIT: "bg-red-500/10 text-red-300",
  CANCELLED: "bg-gray-500/10 text-gray-300",
};

const StatusPill = ({ value }) => (
  <span
    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${statusClass[value] || "bg-white/10 text-white"}`}
  >
    {value}
  </span>
);

StatusPill.propTypes = {
  value: PropTypes.string.isRequired,
};

const formatId = (id) => (id ? `#${id.slice(0, 8)}` : "-");

const getEvidence = (charge) => {
  if (!charge?.evidence) return {};
  if (typeof charge.evidence === "string") {
    try {
      return JSON.parse(charge.evidence);
    } catch {
      return {};
    }
  }
  return charge.evidence;
};

const getDisputeInfo = (charge) => getEvidence(charge).dispute || null;

const formatDateTime = (value) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value))
    : "";

const FinancialOperations = () => {
  const [queue, setQueue] = useState({ deposits: [], charges: [] });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await adminService.getFinancialQueue(100);
      setQueue(result.data || { deposits: [], charges: [] });
    } catch (err) {
      setError(err.message || "Không thể tải hàng chờ tài chính");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const totals = useMemo(() => {
    const pendingChargeAmount = queue.charges.reduce(
      (sum, charge) => sum + Number(charge.amount || 0),
      0,
    );
    const heldDepositAmount = queue.deposits.reduce(
      (sum, deposit) => sum + Number(deposit.heldAmount || 0),
      0,
    );
    return {
      pendingChargeAmount,
      heldDepositAmount,
    };
  }, [queue]);

  const reviewCharge = async (charge, status) => {
    const note = window.prompt("Ghi chú xử lý", "");
    if (note === null) return;

    setBusyId(charge.id);
    try {
      await adminService.reviewPostTripCharge(charge.id, {
        status,
        notes: note,
      });
      await loadQueue();
    } catch (err) {
      alert(err.message || "Không thể cập nhật phí");
    } finally {
      setBusyId(null);
    }
  };

  const captureBooking = async (bookingId) => {
    if (
      !window.confirm("Khấu trừ tất cả phí đã duyệt từ tiền cọc booking này?")
    )
      return;

    setBusyId(`capture-${bookingId}`);
    try {
      await adminService.captureApprovedCharges(bookingId);
      await loadQueue();
    } catch (err) {
      alert(err.message || "Không thể khấu trừ tiền cọc");
    } finally {
      setBusyId(null);
    }
  };

  const releaseBooking = async (bookingId) => {
    if (!window.confirm("Ghi nhận hoàn phần tiền cọc còn lại cho booking này?"))
      return;

    setBusyId(`release-${bookingId}`);
    try {
      await adminService.releaseDeposit(bookingId);
      await loadQueue();
    } catch (err) {
      alert(err.message || "Không thể hoàn cọc");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-white">
        <div className="w-10 h-10 border-4 border-pumpkin/20 border-t-pumpkin rounded-full animate-spin mb-4"></div>
        <p>Đang tải hàng chờ tài chính...</p>
      </div>
    );
  }

  return (
    <div className="p-6 text-white min-h-screen">
      <div className="flex flex-wrap justify-between gap-4 items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-wider">
            Tài chính sau chuyến
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Quản lý phí phát sinh, khấu trừ và hoàn cọc.
          </p>
        </div>
        <button
          onClick={loadQueue}
          className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold"
        >
          Làm mới
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-primary border border-white/5 rounded-xl p-5">
          <p className="text-gray-400 text-xs uppercase tracking-widest">
            Phí cần xử lý
          </p>
          <p className="text-2xl font-bold mt-2">{queue.charges.length}</p>
        </div>
        <div className="bg-primary border border-white/5 rounded-xl p-5">
          <p className="text-gray-400 text-xs uppercase tracking-widest">
            Tổng phí chờ
          </p>
          <p className="text-2xl font-bold mt-2">
            {money.format(totals.pendingChargeAmount)}
          </p>
        </div>
        <div className="bg-primary border border-white/5 rounded-xl p-5">
          <p className="text-gray-400 text-xs uppercase tracking-widest">
            Tiền cọc đang giữ
          </p>
          <p className="text-2xl font-bold mt-2">
            {money.format(totals.heldDepositAmount)}
          </p>
        </div>
      </div>

      <section className="bg-primary rounded-xl border border-white/5 overflow-hidden shadow-2xl mb-6">
        <div className="p-5 border-b border-white/5">
          <h3 className="font-bold uppercase tracking-wider">Phí phát sinh</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[880px]">
            <thead>
              <tr className="text-gray-400 border-b border-white/5 text-xs uppercase tracking-widest">
                <th className="p-5">Booking</th>
                <th className="p-5">Loại phí</th>
                <th className="p-5">Trạng thái</th>
                <th className="p-5">Số tiền</th>
                <th className="p-5">Mô tả / Khiếu nại</th>
                <th className="p-5">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {queue.charges.length > 0 ? (
                queue.charges.map((charge) => {
                  const dispute = getDisputeInfo(charge);

                  return (
                    <tr
                      key={charge.id}
                      className="border-b border-white/5 hover:bg-white/5"
                    >
                      <td className="p-5 font-semibold">
                        {formatId(charge.bookingId)}
                      </td>
                      <td className="p-5 text-sm">{charge.type}</td>
                      <td className="p-5">
                        <StatusPill value={charge.status} />
                      </td>
                      <td className="p-5 font-semibold">
                        {money.format(charge.amount || 0)}
                      </td>
                      <td className="p-5 text-sm text-gray-300 max-w-[360px]">
                        <p>{charge.description}</p>
                        {dispute && (
                          <div className="mt-3 rounded-lg border border-purple-400/20 bg-purple-500/10 p-3 text-purple-100">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-200">
                              Khiếu nại của renter
                            </p>
                            <p className="mt-1 text-xs">{dispute.reason}</p>
                            {dispute.disputedAt && (
                              <p className="mt-1 text-[11px] text-purple-200/80">
                                Gửi lúc {formatDateTime(dispute.disputedAt)}
                              </p>
                            )}
                            {dispute.evidenceUrls?.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {dispute.evidenceUrls.map((url, index) => (
                                  <a
                                    key={url}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] font-semibold text-purple-100 underline decoration-purple-300/60"
                                  >
                                    Bằng chứng {index + 1}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-5">
                        <div className="flex flex-wrap gap-2">
                          {charge.status === "PENDING_REVIEW" && (
                            <>
                              <button
                                disabled={busyId === charge.id}
                                onClick={() =>
                                  reviewCharge(charge, "APPROVED")
                                }
                                className="px-3 py-1.5 rounded-md bg-green-500/20 text-green-300 hover:bg-green-500 hover:text-white text-xs font-bold"
                              >
                                Duyệt
                              </button>
                              <button
                                disabled={busyId === charge.id}
                                onClick={() => reviewCharge(charge, "WAIVED")}
                                className="px-3 py-1.5 rounded-md bg-gray-500/20 text-gray-300 hover:bg-gray-500 hover:text-white text-xs font-bold"
                              >
                                Miễn
                              </button>
                              <button
                                disabled={busyId === charge.id}
                                onClick={() =>
                                  reviewCharge(charge, "DISPUTED")
                                }
                                className="px-3 py-1.5 rounded-md bg-purple-500/20 text-purple-300 hover:bg-purple-500 hover:text-white text-xs font-bold"
                              >
                                Tranh chấp
                              </button>
                            </>
                          )}
                          {charge.status === "DISPUTED" && (
                            <>
                              <button
                                disabled={busyId === charge.id}
                                onClick={() =>
                                  reviewCharge(charge, "APPROVED")
                                }
                                className="px-3 py-1.5 rounded-md bg-green-500/20 text-green-300 hover:bg-green-500 hover:text-white text-xs font-bold"
                              >
                                Chấp nhận thu
                              </button>
                              <button
                                disabled={busyId === charge.id}
                                onClick={() => reviewCharge(charge, "WAIVED")}
                                className="px-3 py-1.5 rounded-md bg-gray-500/20 text-gray-300 hover:bg-gray-500 hover:text-white text-xs font-bold"
                              >
                                Miễn phí
                              </button>
                              <button
                                disabled={busyId === charge.id}
                                onClick={() =>
                                  reviewCharge(charge, "CANCELLED")
                                }
                                className="px-3 py-1.5 rounded-md bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white text-xs font-bold"
                              >
                                Hủy phí
                              </button>
                            </>
                          )}
                          {charge.status === "APPROVED" && (
                            <button
                              disabled={
                                busyId === `capture-${charge.bookingId}`
                              }
                              onClick={() => captureBooking(charge.bookingId)}
                              className="px-3 py-1.5 rounded-md bg-pumpkin/20 text-pumpkin hover:bg-pumpkin hover:text-white text-xs font-bold"
                            >
                              Khấu trừ
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="p-10 text-center text-gray-500 italic"
                  >
                    Không có phí phát sinh cần xử lý.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-primary rounded-xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-white/5">
          <h3 className="font-bold uppercase tracking-wider">Tiền cọc</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[820px]">
            <thead>
              <tr className="text-gray-400 border-b border-white/5 text-xs uppercase tracking-widest">
                <th className="p-5">Booking</th>
                <th className="p-5">Trạng thái</th>
                <th className="p-5">Đang giữ</th>
                <th className="p-5">Phí chờ</th>
                <th className="p-5">Đã khấu trừ</th>
                <th className="p-5">Có thể hoàn</th>
                <th className="p-5">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {queue.deposits.length > 0 ? (
                queue.deposits.map((deposit) => (
                  <tr
                    key={deposit.id}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="p-5 font-semibold">
                      {formatId(deposit.bookingId)}
                    </td>
                    <td className="p-5">
                      <StatusPill value={deposit.status} />
                    </td>
                    <td className="p-5">
                      {money.format(deposit.heldAmount || 0)}
                    </td>
                    <td className="p-5">
                      {money.format(deposit.pendingChargeAmount || 0)}
                    </td>
                    <td className="p-5">
                      {money.format(deposit.capturedAmount || 0)}
                    </td>
                    <td className="p-5">
                      {money.format(deposit.releasedAmount || 0)}
                    </td>
                    <td className="p-5">
                      <div className="flex flex-wrap gap-2">
                        {deposit.status === "RELEASE_PENDING" && (
                          <button
                            disabled={busyId === `release-${deposit.bookingId}`}
                            onClick={() => releaseBooking(deposit.bookingId)}
                            className="px-3 py-1.5 rounded-md bg-green-500/20 text-green-300 hover:bg-green-500 hover:text-white text-xs font-bold"
                          >
                            Hoàn cọc
                          </button>
                        )}
                        {deposit.status === "PENDING_CHARGES" && (
                          <button
                            disabled={busyId === `capture-${deposit.bookingId}`}
                            onClick={() => captureBooking(deposit.bookingId)}
                            className="px-3 py-1.5 rounded-md bg-pumpkin/20 text-pumpkin hover:bg-pumpkin hover:text-white text-xs font-bold"
                          >
                            Khấu trừ phí duyệt
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="p-10 text-center text-gray-500 italic"
                  >
                    Không có tiền cọc cần xử lý.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default FinancialOperations;

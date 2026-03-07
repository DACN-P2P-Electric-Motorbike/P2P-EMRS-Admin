import { iconsImgs } from "../utils/images";
import { personsImgs } from "../utils/images";

export const navigationLinks = [
  { id: 1, title: 'Trang chủ', image: iconsImgs.home, path: '/' },
  { id: 2, title: 'Duyệt xe', image: iconsImgs.card, path: '/approve-vehicles' },
  { id: 3, title: 'Thống kê', image: iconsImgs.report, path: '/statistics' },
  { id: 4, title: 'Duyệt người dùng', image: iconsImgs.user, path: '/approve-users' },
  { id: 5, title: 'Báo cáo sự cố', image: iconsImgs.alert, path: '/reports' },
  { id: 6, title: 'Cài đặt', image: iconsImgs.gears, path: '/settings' },
  { id: 7, title: 'Tài khoản', image: iconsImgs.user, path: '/account' },
];

export const transactions = [
    {
        id: 11, 
        name: "Sarah Parker",
        image: personsImgs.person_four,
        date: "23/12/04",
        amount: 22000
    },
    {
        id: 12, 
        name: "Krisitine Carter",
        image: personsImgs.person_three,
        date: "23/07/21",
        amount: 20000
    },
    {
        id: 13, 
        name: "Irene Doe",
        image: personsImgs.person_two,
        date: "23/08/25",
        amount: 30000
    }
];

export const reportData = [
    {
        id: 14,
        month: "Jan",
        value1: 45,
        value2: null
    },
    {
        id: 15,
        month: "Feb",
        value1: 45,
        value2: 60
    },
    {
        id: 16,
        month: "Mar",
        value1: 45,
        value2: null
    },
    {
        id: 17,
        month: "Apr",
        value1: 45,
        value2: null
    },
    {
        id: 18,
        month: "May",
        value1: 45,
        value2: null
    }
];

export const budget = [
    {
        id: 19, 
        title: "Subscriptions",
        type: "Automated",
        amount: 22000
    },
    {
        id: 20, 
        title: "Loan Payment",
        type: "Automated",
        amount: 16000
    },
    {
        id: 21, 
        title: "Foodstuff",
        type: "Automated",
        amount: 20000
    },
    {
        id: 22, 
        title: "Subscriptions",
        type: null,
        amount: 10000
    },
    {
        id: 23, 
        title: "Subscriptions",
        type: null,
        amount: 40000
    }
];

export const subscriptions = [
    {
        id: 24,
        title: "LinkedIn",
        due_date: "23/12/04",
        amount: 20000
    },
    {
        id: 25,
        title: "Netflix",
        due_date: "23/12/10",
        amount: 5000
    },
    {
        id: 26,
        title: "DSTV",
        due_date: "23/12/22",
        amount: 2000
    }
];

export const savings = [
    {
        id: 27,
        image: personsImgs.person_one,
        saving_amount: 250000,
        title: "Pay kid bro’s fees",
        date_taken: "23/12/22",
        amount_left: 40000
    }
]

export const userDetails = {
  id: 1,
  firstName: "Alice",
  lastName: "Doe",
  email: "alice.doe@admin.com",
  phone: "+84 987 654 321",
  address: "Hanoi, Vietnam",
  role: "Super Admin",
  avatar: personsImgs.person_two, // Đảm bảo bạn đã import hình này
  bio: "Senior System Administrator with 10 years of experience in managing high-traffic web applications.",
  joinDate: "20/01/2023"
};

// src/data/data.js

export const dashboardData = {
  status: "success",
  data: {
    metrics: {
      revenue: {
        total: 125000000,
        previous_period: 95000000,
        growth_percent: 31.5
      },
      bookings: {
        total: 850,
        active: 45,
        pending: 12,
        this_period: 120,
        growth_percent: 18.2
      },
      users: {
        total: 2450,
        new_this_period: 156,
        growth_percent: 12.5
      },
      vehicles: {
        total: 120,
        available: 85,
        rented: 25,
        maintenance: 8,
        pendingApproval: 2
      }
    },
    chart_data: [
      { month: "Jan", revenue: 10000000, bookings: 120 },
      { month: "Feb", revenue: 12000000, bookings: 140 },
      { month: "Mar", revenue: 15000000, bookings: 160 },
      { month: "Apr", revenue: 13000000, bookings: 135 },
      { month: "May", revenue: 18000000, bookings: 190 },
      { month: "Jun", revenue: 22000000, bookings: 210 },
      { month: "Jul", revenue: 25000000, bookings: 240 },
      { month: "Aug", revenue: 21000000, bookings: 205 },
      { month: "Sep", revenue: 28000000, bookings: 260 },
      { month: "Oct", revenue: 32000000, bookings: 310 },
      { month: "Nov", revenue: 35000000, bookings: 330 },
      { month: "Dec", revenue: 40000000, bookings: 380 }
    ],
    recent_transactions: [
      {
        id: "TX-001",
        user_name: "Nguyễn Văn A",
        vehicle_name: "VINFAST Klara S",
        amount: 2500000,
        status: "COMPLETED",
        date: "2023-10-25T10:00:00Z"
      },
      {
        id: "TX-002",
        user_name: "Lê Thị B",
        vehicle_name: "Pega Aura S",
        amount: 1800000,
        status: "PENDING",
        date: "2023-10-26T08:30:00Z"
      },
      {
        id: "TX-003",
        user_name: "Trần Văn C",
        vehicle_name: "Yadea G5",
        amount: 3200000,
        status: "COMPLETED",
        date: "2023-10-26T14:15:00Z"
      },
      {
        id: "TX-004",
        user_name: "Phạm Minh D",
        vehicle_name: "VinFast Theon",
        amount: 5000000,
        status: "CANCELLED",
        date: "2023-10-27T09:00:00Z"
      },
      {
        id: "TX-005",
        user_name: "Hoàng Anh E",
        vehicle_name: "Dat Bike Weaver",
        amount: 4500000,
        status: "COMPLETED",
        date: "2023-10-27T16:45:00Z"
      }
    ]
  }
};
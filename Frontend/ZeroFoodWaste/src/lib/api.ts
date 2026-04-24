const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const getAuthToken = (): string | null => {
  return localStorage.getItem("token");
};

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAuthToken();

  const headersObj: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headersObj[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headersObj[key] = value;
      });
    } else {
      Object.assign(headersObj, options.headers);
    }
  }

  if (token) {
    headersObj.Authorization = `Bearer ${token}`;
  }

  console.log(`🌐 ${options.method || "GET"} ${endpoint}`);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: headersObj,
  });

  const data = await response.json();
  console.log(`📥 Response (${response.status}):`, data);

  if (!response.ok) {
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }

  return data;
}

export const api = {
  // Generic request methods
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: "GET" }),

  post: <T>(endpoint: string, data: any) =>
    apiRequest<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  put: <T>(endpoint: string, data: any) =>
    apiRequest<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: "DELETE" }),

  login: (email: string, password: string) =>
    apiRequest<{ success: boolean; token: string; data: { user: any } }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
    ),

  register: (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    location?: any;
    phone?: string;
  }) =>
    apiRequest<{ success: boolean; token: string; data: { user: any } }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    ),

  logout: () =>
    apiRequest<{ success: boolean; message: string }>("/auth/logout", {
      method: "POST",
    }),

  getMe: () =>
    apiRequest<{ success: boolean; data: { user: any } }>("/auth/me", {
      method: "GET",
    }),

  updatePassword: (currentPassword: string, newPassword: string) =>
    apiRequest<{ success: boolean; message: string; token: string }>(
      "/auth/updatepassword",
      {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      },
    ),

  forgotPassword: (email: string) =>
    apiRequest<{ success: boolean; message: string }>("/auth/forgotpassword", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    apiRequest<{ success: boolean; message: string; token: string }>(
      "/auth/resetpassword",
      {
        method: "POST",
        body: JSON.stringify({ token, password }),
      },
    ),

  getPlatformStats: () =>
    apiRequest<{
      success: boolean;
      data: { totalDonors: number; totalNGOs: number; completedDonations: number };
    }>("/stats"),

  getDonations: (params?: {
    status?: string;
    page?: number;
    limit?: number;
    donorId?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.donorId) query.append("donorId", params.donorId);
    return apiRequest<{ success: boolean; data: { donations: any[] } }>(
      `/donations?${query}`,
    );
  },

  createDonation: (data: any) =>
    apiRequest<{ success: boolean; data: { donation: any } }>("/donations", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getDonation: (id: string) =>
    apiRequest<{ success: boolean; data: { donation: any } }>(
      `/donations/${id}`,
    ),

  getUsers: (params?: { role?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.role) query.append("role", params.role);
    if (params?.status) query.append("status", params.status);
    return apiRequest<{ success: boolean; data: { users: any[] } }>(
      `/users?${query}`,
    );
  },

  getUser: (id: string) =>
    apiRequest<{ success: boolean; data: { user: any } }>(`/users/${id}`),

  updateUser: (id: string, data: any) =>
    apiRequest<{ success: boolean; data: { user: any } }>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  acceptDonation: (id: string) =>
    apiRequest<{ success: boolean; data: { donation: any } }>(
      `/donations/${id}/accept`,
      {
        method: "PUT",
      },
    ),

  getNearbyDonations: (params: {
    lat: number;
    lng: number;
    radius?: number;
    status?: string;
  }) => {
    const query = new URLSearchParams();
    query.append("lat", params.lat.toString());
    query.append("lng", params.lng.toString());
    if (params.radius) query.append("radius", params.radius.toString());
    if (params.status) query.append("status", params.status);

    return apiRequest<{
      success: boolean;
      data: { donations: any[]; count: number };
    }>(`/matching/nearby-donations?${query}`);
  },

  getMyAssignments: (status?: string) => {
    const query = new URLSearchParams();
    if (status) query.append("status", status);
    return apiRequest<{ success: boolean; data: { assignments: any[] } }>(
      `/matching/my-assignments?${query}`,
    );
  },

  updateAssignmentStatus: (id: string, status: string, notes?: string) =>
    apiRequest<{ success: boolean; data: { assignment: any } }>(
      `/matching/assignments/${id}/status`,
      {
        method: "PUT",
        body: JSON.stringify({ status, notes }),
      },
    ),

  getAvailableTasks: () =>
    apiRequest<{ success: boolean; data: { donations: any[]; count: number } }>(
      `/matching/available-for-pickup`,
    ),

  acceptTask: (donationId: string) =>
    apiRequest<{ success: boolean; data: { assignment: any; donation: any } }>(
      `/matching/accept-task/${donationId}`,
      {
        method: "POST",
      },
    ),

  completeAssignment: (assignmentId: string) =>
    apiRequest<{ success: boolean; data: { assignment: any } }>(
      `/matching/assignments/${assignmentId}/complete`,
      {
        method: "POST",
      },
    ),

  // Notification endpoints
  getNotifications: (unreadOnly?: boolean, limit?: number) => {
    const query = new URLSearchParams();
    if (unreadOnly) query.append("unreadOnly", "true");
    if (limit) query.append("limit", limit.toString());
    return apiRequest<{
      success: boolean;
      data: { notifications: any[] };
    }>(`/notifications?${query}`);
  },

  getUnreadNotificationCount: () =>
    apiRequest<{ success: boolean; data: { count: number } }>(
      `/notifications/unread-count`,
    ),

  markNotificationAsRead: (notificationId: string) =>
    apiRequest<{ success: boolean; data: { notification: any } }>(
      `/notifications/${notificationId}/read`,
      {
        method: "PUT",
      },
    ),

  markAllNotificationsAsRead: () =>
    apiRequest<{
      success: boolean;
      message: string;
      data: { modifiedCount: number };
    }>(`/notifications/read-all`, {
      method: "PUT",
    }),

  deleteNotification: (notificationId: string) =>
    apiRequest<{ success: boolean; message: string }>(
      `/notifications/${notificationId}`,
      {
        method: "DELETE",
      },
    ),

  // Achievement endpoints
  getAchievements: () =>
    apiRequest<{
      success: boolean;
      data: Array<any>;
    }>(`/achievements`),

  getBadges: () =>
    apiRequest<{
      success: boolean;
      data: Array<any>;
    }>(`/achievements/badges`),

  getAchievementStats: () =>
    apiRequest<{
      success: boolean;
      data: {
        totalPoints: number;
        achievementsEarned: number;
        badgesEarned: number;
        recentAchievements: Array<any>;
      };
    }>(`/achievements/stats`),

  getRoleAchievements: () =>
    apiRequest<{
      success: boolean;
      data: Array<any>;
    }>(`/achievements/role`),

  getBadgeLevels: () =>
    apiRequest<{
      success: boolean;
      data: {
        levels: Array<any>;
      };
    }>(`/achievements/badges/levels`),

  // Map endpoints - Nearby locations
  getNearbyNGOs: (params: { lat: number; lng: number; radius?: number }) => {
    const query = new URLSearchParams();
    query.append("lat", params.lat.toString());
    query.append("lng", params.lng.toString());
    if (params.radius) query.append("radius", params.radius.toString());
    return apiRequest<{
      success: boolean;
      data: { ngos: any[]; count: number };
    }>(`/matching/nearby-ngos?${query}`);
  },

  getNearbyVolunteers: (params: {
    lat: number;
    lng: number;
    radius?: number;
  }) => {
    const query = new URLSearchParams();
    query.append("lat", params.lat.toString());
    query.append("lng", params.lng.toString());
    if (params.radius) query.append("radius", params.radius.toString());
    return apiRequest<{
      success: boolean;
      data: { volunteers: any[]; count: number };
    }>(`/matching/nearby-volunteers?${query}`);
  },

  // Geocoding - Convert address to coordinates (using Nominatim/OpenStreetMap - FREE)
  geocodeAddress: (address: string) => {
    return fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.length > 0) {
          return {
            success: true,
            data: {
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon),
              address: data[0].display_name,
            },
          };
        }
        return {
          success: false,
          error: "Address not found",
        };
      });
  },

  // Reverse Geocoding - Convert coordinates to address (using Nominatim/OpenStreetMap - FREE)
  reverseGeocode: (lat: number, lng: number) => {
    return fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    )
      .then((res) => res.json())
      .then((data) => {
        return {
          success: true,
          data: {
            address:
              data.address?.road || data.address?.hamlet || data.display_name,
            fullAddress: data.display_name,
            components: data.address,
          },
        };
      });
  },
};

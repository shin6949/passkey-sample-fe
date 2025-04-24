import axiosInstance from "./AxiosInstance";
import { AxiosResponse } from "axios";
import { ApiResponse } from "../model/ApiResponse";
import { ProfileUpdateRequest } from "../model/ProfileApiResponse";

/**
 * 비밀번호 변경 전, 현재 비밀번호 확인 API
 */
export const checkCurrentPassword = async (
  inputPassword: string,
): Promise<AxiosResponse> => {
  const data = { inputPassword };
  const response = await axiosInstance.post(`/api/profile/password`, data);
  return response;
};

/** 비밀번호 변경 API */
export const updatePassword = async (
  newPassword: string,
  newPasswordConfirm: string,
) => {
  const data = { newPassword, newPasswordConfirm };

  const response = await axiosInstance.put(`/api/profile/password`, data);
  return response;
};

/** 비밀번호 변경 인가 코드 폐기 API */
export const revokePasswordChangeAuthorizationToken = async () => {
  const response = await axiosInstance.get(
    `/api/profile/password/revoke_token`,
  );
  return response;
};

/** Profile을 갖고오는 API */
export const fetchProfile = async (): Promise<AxiosResponse> => {
  const response = await axiosInstance.get(`/api/profile`);
  return response;
};

/** Profile을 수정하는 API */
export const updateProfile = async (
  file: File | null,
  bodyData: ProfileUpdateRequest,
) => {
  const formData = new FormData();

  if (file !== null) {
    formData.append("profileImage", file);
  } else if (bodyData.isProfileImageChanged) {
    formData.append("profileImage", new Blob([]), "empty.jpg");
  }

  const profileDataBlob = new Blob(
    [
      JSON.stringify({
        ...bodyData,
        // 파일 존재 여부 반영
        isProfileImageChanged: file !== null || bodyData.isProfileImageChanged,
      }),
    ],
    { type: "application/json" },
  );
  formData.append("profileData", profileDataBlob);

  try {
    const response = await axiosInstance.put("/api/profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw new Error("프로필 업데이트 실패");
  }
};

import axiosInstance from "./AxiosInstance";
import { AxiosResponse } from "axios";
import { ApiResponse } from "../model/ApiResponse";

/** 회원조회 API */
export const fetchLoginUser = async (): Promise<ApiResponse<UserResponse>> => {
  const response = await axiosInstance.get(`/api/user/me`);
  return response.data;
};

export const fetchUser = async (
  userId: string,
): Promise<ApiResponse<UserResponse>> => {
  const response = await axiosInstance.get(`/api/user/${userId}`);
  return response.data;
};

/** SIGNUP API */
export const signUp = async ({
  name,
  email,
  password,
  passwordConfirm,
  useGravatar,
}: {
  name: string;
  email: string;
  passwordConfirm: string;
  password: string;
  useGravatar: boolean;
}): Promise<AxiosResponse> => {
  const data = { name, email, password, passwordConfirm, useGravatar };
  const response = await axiosInstance.post(`/api/user/sign-up`, data);
  return response;
};

/** 중복 이메일 조회 API */
export const checkDuplicateEmail = async (
  email: string,
): Promise<ApiResponse<EmailCheckResponse>> => {
  const response = await axiosInstance.get(`/api/user/check-email`, {
    params: { email },
  });

  return response.data;
};

/** 회원수정 API */
export const updateUser = async (data: Record<string, any>) => {
  const response = await axiosInstance.put(`/api/user`, data);
  return response.data;
};

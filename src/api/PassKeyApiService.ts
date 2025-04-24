import { AxiosResponse } from "axios";
import { ApiResponse } from "../model/ApiResponse";
import axiosInstance from "./AxiosInstance";

/**
 * 계정에 등록된 패스키 목록을 조회합니다.
 *
 * @returns 패스키 목록 조회 응답
 */
export const getPassKeyList = async (): Promise<
  ApiResponse<PassKeyListResponse[]>
> => {
  const response: AxiosResponse<ApiResponse<PassKeyListResponse[]>> =
    await axiosInstance.get(`/api/passkey`);

  return response.data;
};

export const updatePassKeyLabel = async ({
  uuid,
  name,
}: {
  uuid: string;
  name: string;
}): Promise<AxiosResponse> => {
  const response: AxiosResponse<ApiResponse<PassKeyListResponse>> =
    await axiosInstance.put(`/api/passkey`, {
      uuid,
      name,
    });

  return response;
};

export const deletePassKey = async (uuid: string): Promise<AxiosResponse> => {
  const response: AxiosResponse<ApiResponse<PassKeyListResponse>> =
    await axiosInstance.delete(`/api/passkey/${uuid}`);

  return response;
};

export interface ProfileFetchResponse {
  email: string;
  name: string;
  profileImage: string;
  useGravatar: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileUpdateRequest {
  email: string;
  name: string;
  useGravatar: boolean;
  isProfileImageChanged: boolean;
  isEmailChanged: boolean;
  isEmailChecked: boolean;
}

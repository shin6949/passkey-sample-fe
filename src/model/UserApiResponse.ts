interface UserResponse {
  id: string;
  name: string;
  useGravatar: boolean;
  profileUrl: string;
  role: String;
}

interface EmailCheckResponse {
  isExists: boolean;
}

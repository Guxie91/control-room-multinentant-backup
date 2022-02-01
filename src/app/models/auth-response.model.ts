export class AuthResponse {
  constructor(
    public success: string,
    public message: string,
    public expiresIn?: string,
    public expiresAt?: string,
    public token?: string,
    public org?: string,
    public id_org?: string,
    public profile?: string
  ) {}
}

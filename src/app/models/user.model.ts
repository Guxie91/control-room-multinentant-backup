export class User{
  constructor(
    public username:string,
    public expiresIn?: string,
    public expiresAt?: string,
    public token?: string,
    public org?: string,
    public id_org?: string,
    public profile?: string
  ) {}
}

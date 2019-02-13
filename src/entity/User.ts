import { Entity, BaseEntity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("users")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column("varchar", { length: 255 })
  email: string;

  @Column("text") password: string;

  @Column("text", { default: "AF" }) continent: string;

  @Column("boolean", { default: false })
  confirmed: boolean;
}

ALTER TABLE "user" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "password" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "numero_de_bac" varchar(20) NOT NULL;--> statement-breakpoint
CREATE INDEX "numero_de_bac_idx" ON "user" USING btree ("numero_de_bac");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_numero_de_bac_unique" UNIQUE("numero_de_bac");
CREATE INDEX "password_history_user_id_idx" ON "password_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "snippets_user_id_idx" ON "snippets" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "snippets_user_id_slug_idx" ON "snippets" USING btree ("user_id","slug");
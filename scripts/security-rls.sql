-- Server-only Prisma tables. Preserve postgres/service_role access.
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."User" FROM anon, authenticated;
ALTER TABLE public."Raffle" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."Raffle" FROM anon, authenticated;
ALTER TABLE public."Participant" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."Participant" FROM anon, authenticated;
ALTER TABLE public."Order" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."Order" FROM anon, authenticated;
ALTER TABLE public."RaffleNumber" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."RaffleNumber" FROM anon, authenticated;
ALTER TABLE public."OrderItem" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."OrderItem" FROM anon, authenticated;
ALTER TABLE public."Payment" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."Payment" FROM anon, authenticated;
ALTER TABLE public."WebhookEvent" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."WebhookEvent" FROM anon, authenticated;
ALTER TABLE public."Draw" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."Draw" FROM anon, authenticated;
ALTER TABLE public."Settings" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."Settings" FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;


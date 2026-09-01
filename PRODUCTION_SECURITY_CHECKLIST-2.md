# Production security checklist

- [ ] PostgreSQL for durable application data
- [ ] Shared Redis/session store for multi-instance deployments
- [ ] MFA for Admin; recommended for Manager/Underwriter
- [ ] Server-side RBAC on every protected API
- [ ] HttpOnly + Secure + SameSite cookies
- [ ] Login and API rate limiting
- [ ] CSRF protection for state-changing browser requests
- [ ] Security headers/CSP
- [ ] Private document storage + file validation + malware scanning
- [ ] Gemini API key only on the server
- [ ] Prompt-injection-resistant AI instructions
- [ ] Append-only/immutable audit log storage
- [ ] Backup + tested restore procedure
- [ ] Critical change approval (four-eyes)
- [ ] Dependency and container vulnerability scanning
- [ ] Independent penetration test before production

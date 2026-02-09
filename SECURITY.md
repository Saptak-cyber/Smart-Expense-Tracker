# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please email: **security@yourapp.com**

Include in your report:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

- **24 hours:** Initial response acknowledging receipt
- **72 hours:** Assessment and severity classification
- **7 days:** Fix development and testing
- **14 days:** Patch release and disclosure

## Security Measures

### Implemented Protections

#### 1. Authentication & Authorization

- ✅ Supabase JWT-based authentication
- ✅ Row-Level Security (RLS) policies
- ✅ Session management with secure cookies
- ✅ Password requirements (min 8 characters)
- ✅ Email verification for new accounts

#### 2. Input Validation

- ✅ Zod schema validation for all inputs
- ✅ Type checking with TypeScript
- ✅ File upload restrictions (type, size)
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS prevention (React escaping + CSP headers)

#### 3. API Security

- ✅ Rate limiting (100 req/min per IP)
- ✅ CORS configuration
- ✅ API route authentication middleware
- ✅ Request size limits
- ✅ Environment variable validation

#### 4. Network Security

- ✅ HTTPS enforcement (HSTS header)
- ✅ Secure headers (CSP, X-Frame-Options, etc.)
- ✅ CSRF protection (Next.js built-in)
- ✅ Clickjacking protection
- ✅ Content sniffing prevention

#### 5. Data Protection

- ✅ Encrypted data at rest (Supabase)
- ✅ Encrypted data in transit (TLS 1.3)
- ✅ Secure password hashing (bcrypt)
- ✅ No sensitive data in logs
- ✅ PII minimization

### Security Headers

All pages include the following security headers:

```http
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(self), geolocation=()
Content-Security-Policy: [See next.config.mjs]
```

### Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Default:** 100 requests per minute per IP
- **Auth endpoints:** 10 requests per minute
- **File uploads:** 5 requests per minute

## Vulnerability Disclosure

### Known Issues

None at this time.

### Past Vulnerabilities

None to date (project launched 2026-02-09).

## Security Best Practices

### For Developers

1. **Never commit secrets**
   - Use `.env.local` for sensitive data
   - Add `.env.local` to `.gitignore`
   - Use environment variables in production

2. **Validate all inputs**
   - Use Zod schemas for validation
   - Never trust client data
   - Sanitize before database insertion

3. **Follow principle of least privilege**
   - Use RLS policies in Supabase
   - Limit API route permissions
   - Minimize scope of API keys

4. **Keep dependencies updated**
   ```bash
   npm audit
   npm update
   ```

5. **Review code for security**
   - Check for hardcoded secrets
   - Validate authentication logic
   - Review SQL queries
   - Test error handling

### For Users

1. **Use strong passwords**
   - Minimum 12 characters
   - Mix of upper, lower, numbers, symbols
   - Unique password for this app

2. **Enable 2FA** (when available)

3. **Review permissions**
   - Check what data the app accesses
   - Revoke unused integrations

4. **Keep browser updated**
   - Update to latest version
   - Enable automatic updates

5. **Be cautious with receipts**
   - Don't upload sensitive documents
   - Review OCR extracted data
   - Delete old receipts periodically

## Incident Response Plan

### In Case of Breach

1. **Immediate Actions**
   - Disable affected systems
   - Revoke compromised credentials
   - Notify security team

2. **Investigation**
   - Identify scope of breach
   - Determine data affected
   - Find root cause

3. **Remediation**
   - Patch vulnerability
   - Deploy security updates
   - Reset passwords if needed

4. **Communication**
   - Notify affected users (within 72 hours)
   - Publish security advisory
   - Update documentation

5. **Post-Incident**
   - Conduct retrospective
   - Implement preventive measures
   - Update security policies

## Compliance

### Data Privacy

- **GDPR Compliance:** User data deletion on request
- **Data Minimization:** Only collect necessary data
- **Right to Access:** Users can export their data
- **Data Portability:** CSV/PDF export available

### Regular Audits

- **Monthly:** Dependency vulnerability scan
- **Quarterly:** Security header check
- **Annually:** Full security audit

## Security Checklist

### Pre-Deployment

- [ ] Environment variables configured securely
- [ ] All dependencies up to date
- [ ] No hardcoded secrets in code
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] Input validation implemented
- [ ] Error messages don't leak sensitive info
- [ ] Logging configured (no PII)
- [ ] Database RLS policies enabled

### Post-Deployment

- [ ] Monitor error logs
- [ ] Review access logs for anomalies
- [ ] Check rate limit effectiveness
- [ ] Verify backup strategy
- [ ] Test incident response plan
- [ ] Review user permissions
- [ ] Update dependencies monthly

## Contact

- **Security Issues:** security@yourapp.com
- **General Support:** support@yourapp.com
- **Website:** https://yourapp.com

## Acknowledgments

We appreciate security researchers who responsibly disclose vulnerabilities. Contributors will be acknowledged in our Hall of Fame (with permission).

---

**Last Updated:** 2026-02-09
**Version:** 1.0.0

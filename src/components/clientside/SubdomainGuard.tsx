"use client";

import React from 'react';
import { apiRoutes } from '@/utils/api';

/**
 * Client-side guard that validates the current subdomain against the
 * backend DB (con_org_master). If the subdomain is not an active org,
 * redirects to vowerp.com.
 *
 * Runs once on mount — extracts subdomain from window.location.hostname,
 * calls GET /authRoutes/validate-subdomain, and redirects if invalid.
 */
export default function SubdomainGuard() {
  const [checked, setChecked] = React.useState(false);

  React.useEffect(() => {
    const validateSubdomain = async () => {
      try {
        const hostname = window.location.hostname;
        let subdomain: string;

        if (hostname.includes('.localhost')) {
          subdomain = hostname.split('.localhost')[0];
        } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
          // Plain localhost without subdomain — allow through
          setChecked(true);
          return;
        } else if (/^\d+(\.\d+){3}(:\d+)?$/.test(hostname)) {
          // IP address detected (e.g., 13.126.47.172:3000 or 192.168.1.1)
          // Use fallback subdomain from env, or allow through with default
          const fallbackSubdomain = process.env.NEXT_PUBLIC_STATIC_SUBDOMAIN || 'sls';
          subdomain = fallbackSubdomain;
        } else {
          subdomain = hostname.split('.')[0];
        }

        if (!subdomain) {
          window.location.href = 'https://vowerp.com';
          return;
        }

        const res = await fetch(
          `${apiRoutes.VALIDATE_SUBDOMAIN}?subdomain=${encodeURIComponent(subdomain)}`
        );

        if (res.ok) {
          const data = await res.json();
          if (!data?.valid) {
            window.location.href = 'https://vowerp.com';
            return;
          }
        } else {
          // API returned an error — fail closed
          window.location.href = 'https://vowerp.com';
          return;
        }
      } catch {
        // Network error — fail closed
        window.location.href = 'https://vowerp.com';
        return;
      }

      setChecked(true);
    };

    validateSubdomain();
  }, []);

  if (!checked) return null;
  return null;
}

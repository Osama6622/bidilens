import { scssToIndentedSass } from '../auditor/syntaxConverter';
import type { SampleFixture } from '../auditor/types';

const brokenNavbarScss = `$surface: #ffffff;
$border: #e2e8f0;
$accent: #2563eb;
$text-main: #0f172a;
$text-muted: #64748b;

.bidi-nav {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  background: $surface;
  border: 1px solid $border;
  border-radius: 12px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
  font-family: system-ui, -apple-system, sans-serif;

  .brand {
    display: flex;
    align-items: center;
    margin-right: 24px;
    font-weight: 700;
    color: $text-main;

    .brand-logo {
      width: 28px;
      height: 28px;
      margin-right: 10px;
      border-radius: 7px;
      background: linear-gradient(135deg, $accent, #0ea5e9);
      color: #fff;
      display: grid;
      place-items: center;
      font-size: 13px;
    }
  }

  .nav-links {
    display: flex;
    gap: 16px;
    font-size: 14px;
    color: $text-muted;

    a {
      text-decoration: none;
      color: inherit;
      font-weight: 500;
    }

    a.active {
      color: $accent;
    }
  }

  .nav-actions {
    display: flex;
    align-items: center;
    margin-left: auto;
    padding-left: 16px;
    border-left: 1px solid $border;

    .bell-btn {
      position: relative;
      margin-right: 14px;
      padding: 6px 10px;
      border-radius: 8px;
      background: #f1f5f9;
      font-size: 14px;

      .unread-dot {
        position: absolute;
        top: -3px;
        right: -3px;
        width: 9px;
        height: 9px;
        border-radius: 999px;
        background: #ef4444;
        border: 2px solid $surface;
      }
    }

    .avatar-pill {
      padding: 6px 12px 6px 8px;
      background: #eff6ff;
      color: #1d4ed8;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 600;
      text-align: left;
    }
  }
}
`;

const iconInputFormScss = `$primary: #4f46e5;
$border: #cbd5e1;
$bg-card: #ffffff;

.auth-card {
  max-width: 440px;
  padding: 22px;
  background: $bg-card;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  font-family: system-ui, -apple-system, sans-serif;
  overflow: hidden;

  .card-title {
    margin: 0 0 6px;
    font-size: 17px;
    font-weight: 700;
    color: #0f172a;
    text-align: left;
  }

  .callout-tip {
    margin: 0 0 16px;
    padding-left: 12px;
    padding-right: 8px;
    border-left: 3px solid $primary;
    color: #475569;
    font-size: 13px;
    text-align: left;
  }

  .field-group {
    margin-bottom: 14px;

    label {
      display: block;
      margin-bottom: 6px;
      font-size: 13px;
      font-weight: 600;
      color: #334155;
      text-align: left;
    }

    .input-shell {
      position: relative;
      display: flex;
      align-items: center;

      .field-icon {
        position: absolute;
        left: 12px;
        font-size: 14px;
        color: #64748b;
        pointer-events: none;
      }

      .field-tag {
        position: absolute;
        right: 10px;
        padding: 2px 7px;
        font-size: 11px;
        font-weight: 600;
        border-radius: 6px;
        background: #eef2ff;
        color: $primary;
      }

      input {
        width: 100%;
        padding-top: 9px;
        padding-bottom: 9px;
        padding-left: 36px;
        padding-right: 76px;
        border: 1px solid $border;
        border-radius: 9px;
        font-size: 13px;
        color: #0f172a;
        text-align: left;
        box-sizing: border-box;
      }
    }
  }

  .submit-btn {
    float: right;
    padding: 9px 16px;
    background: $primary;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }
}
`;

const directionalCardScss = `$emerald: #059669;
$ink: #0f172a;

.release-card {
  position: relative;
  max-width: 440px;
  padding: 22px 20px 20px 28px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-left: 5px solid $emerald;
  border-top-left-radius: 4px;
  border-top-right-radius: 16px;
  border-bottom-right-radius: 16px;
  border-bottom-left-radius: 4px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
  font-family: system-ui, -apple-system, sans-serif;

  .corner-ribbon {
    position: absolute;
    top: 0;
    right: 0;
    padding: 5px 12px;
    background: #ecfdf5;
    color: $emerald;
    font-size: 11px;
    font-weight: 700;
    border-top-right-radius: 15px;
    border-bottom-left-radius: 12px;
  }

  .card-heading {
    margin: 4px 0 8px;
    padding-right: 84px;
    font-size: 16px;
    font-weight: 700;
    color: $ink;
    text-align: left;
  }

  .card-copy {
    margin: 0 0 16px;
    font-size: 13px;
    line-height: 1.5;
    color: #475569;
    text-align: left;
  }

  .card-meta {
    display: flex;
    align-items: center;

    .author-chip {
      display: inline-flex;
      align-items: center;
      margin-right: 12px;
      padding: 4px 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 999px;
      font-size: 12px;
      color: #334155;
    }

    .read-more {
      margin-left: auto;
      font-size: 13px;
      font-weight: 600;
      color: $emerald;
      text-decoration: none;
    }
  }
}
`;

const cleanLogicalScss = `$teal: #0d9488;
$surface: #ffffff;

.logical-banner {
  position: relative;
  max-width: 460px;
  padding-block: 18px;
  padding-inline: 22px 18px;
  background: $surface;
  border: 1px solid #ccfbf1;
  border-inline-start: 4px solid $teal;
  border-start-start-radius: 6px;
  border-start-end-radius: 14px;
  border-end-end-radius: 14px;
  border-end-start-radius: 6px;
  font-family: system-ui, -apple-system, sans-serif;

  .status-pill {
    position: absolute;
    inset-block-start: 14px;
    inset-inline-end: 14px;
    padding-block: 3px;
    padding-inline: 10px;
    border-radius: 999px;
    background: #f0fdfa;
    color: $teal;
    font-size: 11px;
    font-weight: 700;
  }

  .banner-title {
    margin-block: 0 6px;
    padding-inline-end: 96px;
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
    text-align: start;
  }

  .banner-desc {
    margin-block: 0 14px;
    font-size: 13px;
    line-height: 1.5;
    color: #475569;
    text-align: start;
  }

  .banner-footer {
    display: flex;
    align-items: center;
    gap: 10px;

    .metric {
      font-size: 12px;
      font-weight: 600;
      color: #0f766e;
    }

    .cta-link {
      margin-inline-start: auto;
      padding-block: 6px;
      padding-inline: 12px;
      border-radius: 8px;
      background: $teal;
      color: #ffffff;
      font-size: 12px;
      font-weight: 600;
      text-decoration: none;
    }
  }
}
`;

export const SAMPLE_FIXTURES: SampleFixture[] = [
  {
    id: 'broken-navbar',
    name: 'Broken Navbar',
    badge: '9 physical rules',
    description:
      'Navigation bar with physical margin-left: auto, border-left divider, and right-anchored unread badge.',
    html: `<nav class="bidi-nav">
  <div class="brand">
    <span class="brand-logo">B</span>
    <span>Acme Cloud · سحابة أكمي</span>
  </div>
  <div class="nav-links">
    <a href="#overview" class="active">Overview</a>
    <a href="#deployments">Deployments</a>
    <a href="#billing">Billing</a>
  </div>
  <div class="nav-actions">
    <div class="bell-btn" aria-label="Notifications">
      🔔
      <span class="unread-dot"></span>
    </div>
    <div class="avatar-pill">Sara · سارة</div>
  </div>
</nav>`,
    scss: brokenNavbarScss,
    sass: scssToIndentedSass(brokenNavbarScss),
  },
  {
    id: 'icon-input-form',
    name: 'Form with Icon Inputs',
    badge: '11 physical rules',
    description:
      'Input fields with absolute left icons, asymmetric padding, left callout border, and right-floated submit button.',
    html: `<form class="auth-card" onsubmit="return false;">
  <h3 class="card-title">Workspace Invite · دعوة مساحة العمل</h3>
  <p class="callout-tip">Members inherit bilingual project permissions automatically.</p>

  <div class="field-group">
    <label>Team Email · البريد الإلكتروني</label>
    <div class="input-shell">
      <span class="field-icon">✉️</span>
      <input type="email" value="nadia@acme.dev" readonly />
      <span class="field-tag">Verified</span>
    </div>
  </div>

  <div class="field-group">
    <label>Workspace Slug · المعرّف</label>
    <div class="input-shell">
      <span class="field-icon">🌐</span>
      <input type="text" value="mena-design-system" readonly />
      <span class="field-tag">RTL + LTR</span>
    </div>
  </div>

  <button type="submit" class="submit-btn">Send Invite →</button>
</form>`,
    scss: iconInputFormScss,
    sass: scssToIndentedSass(iconInputFormScss),
  },
  {
    id: 'directional-card',
    name: 'Card with Directional Offsets/Borders',
    badge: '13 physical rules',
    description:
      'Release card combining 4-value padding shorthand, physical corner radii, border-left accent, and top-right ribbon.',
    html: `<article class="release-card">
  <span class="corner-ribbon">v3.4 Live</span>
  <h4 class="card-heading">Logical Tokens Migration · تحديث الخصائص المنطقية</h4>
  <p class="card-copy">
    Eliminate directional overrides by mapping physical box offsets and corner radii to inline-start and inline-end tokens.
  </p>
  <footer class="card-meta">
    <span class="author-chip">👩‍💻 Design Ops</span>
    <span class="author-chip">14 Components</span>
    <a href="#changelog" class="read-more">Changelog →</a>
  </footer>
</article>`,
    scss: directionalCardScss,
    sass: scssToIndentedSass(directionalCardScss),
  },
  {
    id: 'clean-logical',
    name: 'Clean Logical Component',
    badge: '0 issues · 100% Bidi',
    description:
      'Reference component authored entirely with CSS Logical Properties — renders natively in both LTR and RTL.',
    html: `<section class="logical-banner">
  <span class="status-pill">100% Logical CSS</span>
  <h4 class="banner-title">Zero Directional Debt · توافق ثنائي الاتجاه</h4>
  <p class="banner-desc">
    Built with margin-inline, padding-inline, inset-inline-end, and logical border-radius tokens for effortless LTR &amp; RTL parity.
  </p>
  <div class="banner-footer">
    <span class="metric">✓ LTR Verified</span>
    <span class="metric">✓ RTL Verified</span>
    <a href="#inspect" class="cta-link">Inspect CSS</a>
  </div>
</section>`,
    scss: cleanLogicalScss,
    sass: scssToIndentedSass(cleanLogicalScss),
  },
];

export function getFixtureById(id: string): SampleFixture {
  return SAMPLE_FIXTURES.find((f) => f.id === id) ?? SAMPLE_FIXTURES[0];
}

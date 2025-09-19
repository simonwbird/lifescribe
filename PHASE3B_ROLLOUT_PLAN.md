# Phase 3B: Date Localization Rollout Plan

## Feature Flag: `date_localisation_v1`

### Rollout Strategy

#### Phase 1: Staff Only (Week 1)
- **Target**: Super admins and admin users only
- **Rollout**: Targeting rules for `role: ["super_admin", "admin"]`
- **Success Criteria**: 
  - No errors in admin panel
  - UTC/local toggle works correctly
  - All date formats render properly for staff

#### Phase 2: 10% Cohort (Week 2)
- **Target**: 10% of general users
- **Rollout**: Global 10% rollout percentage
- **Monitoring**: Watch for error spikes and support tickets
- **Success Criteria**:
  - Error rate < 0.1%
  - No increase in support tickets
  - Performance metrics within acceptable range

#### Phase 3: 100% Rollout (Week 3+)
- **Target**: All users
- **Rollout**: Global 100% rollout percentage
- **Monitoring**: Continued error monitoring with auto-rollback

### Observability

#### Metrics Collection
- **Sampled Metric**: `DATE_RENDER_GATEWAY_USED` per route
  - Component name and route tracking
  - Processing time measurement
  - Success/failure rates
  - User locale/timezone context

#### Error Monitoring
- **Error Sentinel**: `TIMEZONE_ERROR_SENTINEL`
  - Tracks Intl/TimeZone exceptions
  - Auto-rollback at 10 errors/minute threshold
  - Immediate alerting for critical failures

#### Sampling Rate
- Configurable via remote config: `date_render_sampling_rate`
- Default: 1% of all date renders
- Increased to 100% during initial rollout phases

### Admin Tools

#### UTC/Local Toggle
- Available in Super Admin panel: `/admin/date-localization`
- Shows both UTC and localized values side-by-side
- Applies to all date fields in admin views

#### Audit Trail
- All audit logs store canonical UTC timestamps
- Viewer timezone captured at action time
- Enables debugging of timezone-related issues

### Auto-Rollback System

#### Trigger Conditions
- Error rate > 10 errors/minute (configurable)
- Any spike in Intl/TimeZone exceptions
- Manual emergency rollback via admin panel

#### Rollback Process
1. Automatic flag deactivation
2. Immediate alerts to admin team
3. Error logging for post-mortem analysis

### Done Criteria Checklist

- [x] All date renders use `formatForUser`
- [x] Feature flag created with targeting rules
- [x] Observability metrics implemented
- [x] Admin UTC/local toggle present
- [x] Auto-rollback system configured
- [x] Error monitoring with thresholds
- [ ] Unit tests cover GB/US matrix + DST
- [ ] Onboarding/Profile saves locale/tz
- [ ] Mismatch banner functional
- [ ] Backfill + confirmation shipped
- [ ] ESLint rule enforced in CI

### Implementation Files

#### Core Infrastructure
- `src/hooks/useDateRenderTracking.ts` - Metrics collection
- `src/utils/dateWithTracking.ts` - Enhanced formatting with tracking
- `src/components/admin/DateLocalizationPanel.tsx` - Admin control panel
- `src/pages/admin/DateLocalization.tsx` - Admin page

#### Database Setup
- Feature flag: `date_localisation_v1`
- Targeting rules for staff rollout
- Remote config for observability settings

#### Monitoring Dashboard
- Success rate tracking
- Processing time metrics
- Error rate monitoring
- Phase-based rollout controls

### Next Steps

1. **Testing Phase**: Validate all functionality in development
2. **Staff Deployment**: Enable Phase 1 targeting rules
3. **Monitoring Setup**: Verify metrics collection works
4. **Gradual Rollout**: Move through phases based on success criteria
5. **Full Deployment**: 100% rollout with continued monitoring

### Emergency Contacts

- **Primary**: Super Admin team
- **Escalation**: Engineering leadership
- **Rollback Authority**: Any super admin can trigger emergency rollback
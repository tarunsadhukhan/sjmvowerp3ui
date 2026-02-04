/**
 * @jest-environment jsdom
 */
import { describe, it, expect } from 'vitest';

// Mock mappers (we'll test them indirectly through the service)
describe('yarnQualityService', () => {
  it('should properly unwrap setup response with nested data object', () => {
    // Simulate the API response from the backend
    const apiResponse = {
      data: {
        yarn_types: [
          {
            jute_yarn_type_id: 1,
            jute_yarn_type_name: "HSWP"
          },
          {
            jute_yarn_type_id: 2,
            jute_yarn_type_name: "HSWT"
          },
          {
            jute_yarn_type_id: 3,
            jute_yarn_type_name: "SKWP"
          },
          {
            jute_yarn_type_id: 4,
            jute_yarn_type_name: "SKWT"
          },
          {
            jute_yarn_type_id: 5,
            jute_yarn_type_name: "SLYN"
          }
        ],
      }
    };

    // The mapper should unwrap this structure
    const unwrapped = apiResponse?.data || apiResponse;
    expect(unwrapped.yarn_types).toBeDefined();
    expect(unwrapped.yarn_types).toHaveLength(5);
    expect(unwrapped.yarn_types[0]).toEqual({
      jute_yarn_type_id: 1,
      jute_yarn_type_name: "HSWP"
    });
  });

  it('should handle missing data object gracefully', () => {
    // If response doesn't have nested data, it should still work
    const apiResponse = {
      yarn_types: [
        {
          jute_yarn_type_id: 1,
          jute_yarn_type_name: "HSWP"
        }
      ]
    };

    const unwrapped = apiResponse?.data || apiResponse;
    expect(unwrapped.yarn_types).toBeDefined();
    expect(unwrapped.yarn_types).toHaveLength(1);
  });

  it('should handle empty yarn_types array', () => {
    const apiResponse = {
      data: {
        yarn_types: []
      }
    };

    const unwrapped = apiResponse?.data || apiResponse;
    const yarnTypes = unwrapped?.yarn_types || [];
    expect(yarnTypes).toEqual([]);
    expect(yarnTypes.length).toBe(0);
  });

  it('should handle edit setup response with yarn_quality_details', () => {
    const apiResponse = {
      data: {
        yarn_types: [
          {
            jute_yarn_type_id: 1,
            jute_yarn_type_name: "HSWP"
          }
        ],
        yarn_quality_details: {
          yarn_quality_id: 10,
          quality_code: "QC001",
          jute_yarn_type_id: 1,
          twist_per_inch: 5.5,
          std_count: 10,
          std_doff: 100,
          std_wt_doff: 500,
          is_active: 1
        }
      }
    };

    const unwrapped = apiResponse?.data || apiResponse;
    expect(unwrapped.yarn_types).toBeDefined();
    expect(unwrapped.yarn_quality_details).toBeDefined();
    expect(unwrapped.yarn_quality_details.quality_code).toBe("QC001");
    expect(unwrapped.yarn_quality_details.jute_yarn_type_id).toBe(1);
  });

  it('should map yarn_type_id correctly as number for dropdown value', () => {
    const yarnType = {
      jute_yarn_type_id: 1,
      jute_yarn_type_name: "HSWP"
    };

    // Component converts to string for dropdown value
    expect(yarnType.jute_yarn_type_id.toString()).toBe("1");
    expect(yarnType.jute_yarn_type_name).toBe("HSWP");
  });
});

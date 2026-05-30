/** Master-data + tenant catalog DTOs (masters.bundle / masterCatalog / tenants). */
import type { Id } from "@/convex/_generated/dataModel";

export interface MasterOption {
  value: string;
  label: string;
}

export interface MasterRow {
  _id: Id<"masters">;
  category: string;
  value: string;
  label: string;
  position: number;
  isActive: boolean;
}

export interface DistrictOption {
  _id: Id<"districts">;
  code: string;
  name: string;
  stateName: string;
}
export interface UlbOption {
  _id: Id<"municipalities">;
  code: string;
  name: string;
  bodyType: string;
  districtId: Id<"districts">;
  districtName: string;
  districtCode: string;
  stateName: string;
  postalCode: string | null;
}
export interface WardOption {
  _id: Id<"wards">;
  municipalityId: Id<"municipalities">;
  municipalityCode: string;
  wardNo: string;
  wardCode: string;
  name: string;
}

/** Shape of masters.bundle (the single dropdown source of truth). */
export interface MastersBundle {
  updatedAt: number;
  districts: DistrictOption[];
  ulbs: UlbOption[];
  wards: WardOption[];
  assessmentYears: MasterOption[];
  ownershipTypes: MasterOption[];
  propertyUses: MasterOption[];
  propertyUseSubcategories: Record<string, MasterOption[]>;
  propertyUsesRequiringSubcategory: string[];
  situations: MasterOption[];
  roadTypes: MasterOption[];
  taxRateZones: MasterOption[];
  relationships: MasterOption[];
  waterSources: MasterOption[];
  sanitationTypes: MasterOption[];
  usageFactors: MasterOption[];
  usageTypes: MasterOption[];
  constructionTypes: MasterOption[];
  floors: MasterOption[];
}

export interface NotificationRow {
  _id: Id<"notifications">;
  _creationTime: number;
  type: string;
  title: string;
  body: string;
  relatedEntity?: string;
  relatedId?: string;
  readAt?: number;
}

/** Survey feature DTOs — shapes returned by surveys.* and floors/photos. */
import type { Id } from "@/convex/_generated/dataModel";
import type { SurveyStatus, QcStatus, PhotoSlot } from "@/lib/domain";

export interface OwnerEntry {
  name?: string;
  fatherOrHusbandName?: string;
  mobileNo?: string;
  altMobileNo?: string;
}

export interface GpsCapture {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  capturedAt: number;
  provider?: string;
  isMockLocation?: boolean;
}

/** Row shape from surveys.list (Doc<'surveys'>). */
export interface SurveyListItem {
  _id: Id<"surveys">;
  _creationTime: number;
  localId: string;
  surveyorId: Id<"users">;
  districtId: Id<"districts">;
  municipalityId: Id<"municipalities">;
  wardNo: string;
  status: SurveyStatus;
  qcStatus: QcStatus;
  serverVersion: number;
  submittedAt?: number;
  propertyId?: string;
  parcelNo: string;
  unitNo: string;
  respondentName?: string;
  owners?: OwnerEntry[];
  mobileNo: string;
  locality: string;
  colonyName: string;
  city: string;
  pinCode: string;
  assessmentYear: string;
  ownershipType: string;
  propertyType: string;
  propertyUse: string;
  situation: string;
  roadType: string;
  taxRateZone: string;
  plotSqft: number;
  plinthSqft: number;
  isSlum: boolean;
  municipalWaterConnection: boolean;
  waterSource: string;
  sanitationType: string;
  municipalWasteCollection: boolean;
  electricityNo?: string;
  sectorNo?: string;
  oldPropertyNo?: string;
  constructedYear?: number;
  familySize?: number;
  relationship?: string;
  altMobileNo?: string;
  houseNo?: string;
  gps?: GpsCapture;
}

export interface FloorRow {
  _id: Id<"floors">;
  surveyId: Id<"surveys">;
  clientFloorId: string;
  position: number;
  floorName: string;
  usageFactor?: string;
  usageType: string;
  constructionType: string;
  isOccupied: boolean;
  areaSqft: number;
}

export interface PhotoRow {
  _id: Id<"photos">;
  surveyId: Id<"surveys">;
  slot: PhotoSlot;
  storageId: Id<"_storage">;
  sizeKb: number;
  width?: number;
  height?: number;
  capturedAt: number;
  uploadedBy: Id<"users">;
  url: string | null;
}

export interface SurveyRemark {
  _id: Id<"qcRemarks">;
  _creationTime: number;
  message: string;
  authorRole: string;
  taggedSections: string[];
  status: "open" | "resolved";
}

/** Full detail from surveys.get (survey + hydrated children). */
export interface SurveyDetail extends SurveyListItem {
  floors: FloorRow[];
  photos: PhotoRow[];
  qcRemarks: SurveyRemark[];
  surveyor: { _id: Id<"users">; name: string } | null;
}

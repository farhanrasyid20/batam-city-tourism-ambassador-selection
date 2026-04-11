/**
 * Admin module file.
 * Handles admin page/component logic for the Duta Wisata management area.
 */
import type React from "react";
import type { ParticipantResources } from "../../../../../context/AppContext";

export type ResourceTextField = Exclude<
  keyof ParticipantResources,
  | "guideDocument"
  | "submissionDocument"
  | "formS1Document"
  | "formS2Document"
  | "formS3Document"
  | "formS4Document"
  | "twibbonDocument"
  | "twibbonThumbnail"
  | "whatsappThumbnail"
  | "closeUpExamples"
  | "fullBodyExamples"
>;

export type ResourceDocumentField =
  | "guideDocument"
  | "submissionDocument"
  | "formS1Document"
  | "formS2Document"
  | "formS3Document"
  | "formS4Document"
  | "twibbonDocument";

export type ResourceImageField = "twibbonThumbnail" | "whatsappThumbnail";
export type ResourceImageListField = "closeUpExamples" | "fullBodyExamples";

export type DocumentConfig = {
  key: ResourceDocumentField;
  label: string;
};

export type TextSectionConfig = {
  title: string;
  icon: React.ReactNode;
  fields: Array<{
    key: ResourceTextField;
    label: string;
    placeholder: string;
    type?: "text" | "url" | "textarea";
  }>;
};


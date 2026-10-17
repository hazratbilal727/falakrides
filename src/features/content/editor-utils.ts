import {contentFields} from "./fields";
import type {ContentField, ContentValues} from "./types";

export const fieldValue = (field: ContentField, values: ContentValues) => values[field.id] ?? field.value;
export const changedFields = (values: ContentValues, baseline: ContentValues) => contentFields.filter(field => fieldValue(field, values) !== fieldValue(field, baseline));

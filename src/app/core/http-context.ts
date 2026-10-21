import { HttpContextToken } from '@angular/common/http';

/** Set to true on a request to skip the global error toast. */
export const SILENT = new HttpContextToken<boolean>(() => false);

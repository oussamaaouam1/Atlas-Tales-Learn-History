/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as contentValidators from "../contentValidators.js";
import type * as health from "../health.js";
import type * as installs from "../installs.js";
import type * as lib_installAuth from "../lib/installAuth.js";
import type * as lib_stories from "../lib/stories.js";
import type * as progress from "../progress.js";
import type * as quiz from "../quiz.js";
import type * as stories from "../stories.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  contentValidators: typeof contentValidators;
  health: typeof health;
  installs: typeof installs;
  "lib/installAuth": typeof lib_installAuth;
  "lib/stories": typeof lib_stories;
  progress: typeof progress;
  quiz: typeof quiz;
  stories: typeof stories;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

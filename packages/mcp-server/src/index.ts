#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import dotenv from "dotenv";
import { writeFileSync, appendFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Get directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const LOG_FILE = join(__dirname, "../debug.log");

// Initialize log file
function initLog() {
  const timestamp = new Date().toISOString();
  writeFileSync(LOG_FILE, `\n${"=".repeat(80)}\nMCP Server Started: ${timestamp}\n${"=".repeat(80)}\n`);
}

// Log function that writes to file
function log(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] ${message}`;
  if (data !== undefined) {
    logMessage += `\n${JSON.stringify(data, null, 2)}`;
  }
  logMessage += "\n";
  appendFileSync(LOG_FILE, logMessage);
}

// Load environment variables
dotenv.config();
initLog();

// Validate required environment variables
const INTERVALS_API_KEY = process.env.INTERVALS_API_KEY;
const INTERVALS_ATHLETE_ID = process.env.INTERVALS_ATHLETE_ID;

// Log environment variables (sanitized)
log("Environment variables loaded:", {
  INTERVALS_API_KEY: INTERVALS_API_KEY ? `${INTERVALS_API_KEY.substring(0, 4)}...${INTERVALS_API_KEY.substring(INTERVALS_API_KEY.length - 4)}` : "NOT SET",
  INTERVALS_ATHLETE_ID: INTERVALS_ATHLETE_ID || "NOT SET",
  INTERVALS_API_KEY_LENGTH: INTERVALS_API_KEY?.length || 0,
});

if (!INTERVALS_API_KEY) {
  log("ERROR: INTERVALS_API_KEY environment variable is required");
  console.error("Error: INTERVALS_API_KEY environment variable is required");
  process.exit(1);
}

if (!INTERVALS_ATHLETE_ID) {
  log("ERROR: INTERVALS_ATHLETE_ID environment variable is required");
  console.error("Error: INTERVALS_ATHLETE_ID environment variable is required");
  process.exit(1);
}

const BASE_URL = "https://intervals.icu/api/v1";
log("Configuration complete", { BASE_URL, ATHLETE_ID: INTERVALS_ATHLETE_ID });

// Helper function to convert threshold pace from m/s to the format specified by pace_units
function convertThresholdPace(thresholdPaceMs: number | null, paceUnits: string | null): number | null {
  if (!thresholdPaceMs || !paceUnits) {
    return thresholdPaceMs;
  }

  // The API returns threshold_pace in m/s, but pace_units indicates the desired format
  // We need to convert to match pace_units for consistency with pace_zones
  switch (paceUnits) {
    case "SECS_100M":
      // Convert m/s to seconds per 100m
      return 100 / thresholdPaceMs;
    case "MINS_KM":
      // Convert m/s to minutes per km
      return (1000 / thresholdPaceMs) / 60;
    case "MINS_MI":
      // Convert m/s to minutes per mile
      return (1609.34 / thresholdPaceMs) / 60;
    default:
      // Unknown format, return as-is
      return thresholdPaceMs;
  }
}

// Helper function to make authenticated API requests
async function intervalsApiRequest(
  endpoint: string,
  method: "GET" | "POST" | "PUT" = "GET",
  body?: any
): Promise<any> {
  const authString = `API_KEY:${INTERVALS_API_KEY}`;
  const authHeader = `Basic ${Buffer.from(authString).toString("base64")}`;
  const url = `${BASE_URL}${endpoint}`;

  log("Making API request", {
    url,
    method,
    endpoint,
    auth_string_length: authString.length,
    auth_header_length: authHeader.length,
    base64_decoded_preview: authString.substring(0, 10) + "...",
    hasBody: body !== undefined,
  });

  const headers: Record<string, string> = {
    "Authorization": authHeader,
    "Accept": "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  log("API response received", {
    url,
    method,
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    headers: Object.fromEntries(response.headers.entries()),
  });

  if (!response.ok) {
    const errorText = await response.text();
    log("API request failed", {
      url,
      method,
      status: response.status,
      statusText: response.statusText,
      errorBody: errorText,
    });
    throw new Error(
      `intervals.icu API request failed: ${response.status} ${response.statusText}. ${errorText}`
    );
  }

  // Parse response body - first get the raw text to log it
  const responseText = await response.text();

  log("Raw response body received", {
    url,
    method,
    textLength: responseText.length,
    textPreview: responseText.substring(0, 200),
    fullText: responseText.length <= 200 ? responseText : undefined,
  });

  // Now parse the text as JSON
  let data;
  try {
    data = JSON.parse(responseText);
    log("JSON parsing successful", {
      url,
      method,
      dataType: Array.isArray(data) ? "array" : typeof data,
      dataValue: data,
    });
  } catch (parseError) {
    log("Failed to parse JSON response", {
      url,
      method,
      responseText,
      parseError: parseError instanceof Error ? parseError.message : String(parseError),
    });
    throw new Error(`Failed to parse response as JSON: ${responseText}`);
  }

  log("API request successful", {
    url,
    method,
    dataType: Array.isArray(data) ? "array" : typeof data,
    dataLength: Array.isArray(data) ? data.length : undefined,
    dataValue: typeof data === "number" ? data : undefined,
  });

  return data;
}

// Zod schemas for tool parameters
const GetPlannedWorkoutsSchema = z.object({
  start_date: z.string().describe("Start date in ISO-8601 format (e.g., 2025-12-06)"),
  end_date: z.string().describe("End date in ISO-8601 format (e.g., 2025-12-13)"),
});

const GetCompletedActivitiesSchema = z.object({
  start_date: z.string().describe("Start date in ISO-8601 format (e.g., 2025-11-01)"),
  end_date: z.string().describe("End date in ISO-8601 format (e.g., 2025-12-06)"),
});

const CreateWorkoutSchema = z.object({
  date: z.string().describe("Date for the workout in ISO-8601 format (e.g., 2025-12-08)"),
  sport: z.string().describe("Sport type: 'Ride', 'Run', 'Swim', etc."),
  name: z.string().describe("Short workout title (e.g., 'VO₂ 6×2', 'Threshold 4x7')"),
  description: z.string().describe("Textual description of workout intent, purpose, and execution cues"),
  workout_syntax: z.string().describe("intervals.icu workout syntax (Warmup, Main set, Cooldown with steps)"),
  time: z.string().optional().describe("Time of day in HH:MM format (defaults to '00:00')"),
});

const UpdateWorkoutSchema = z.object({
  event_id: z.number().describe("The intervals.icu event ID to replace"),
  date: z.string().describe("Date for the workout in ISO-8601 format (e.g., 2025-12-08)"),
  sport: z.string().describe("Sport type: 'Ride', 'Run', 'Swim', etc."),
  name: z.string().describe("Workout title"),
  description: z.string().describe("Prose description of workout intent and purpose"),
  workout_syntax: z.string().describe("intervals.icu workout syntax (Warmup, Main set, Cooldown with steps)"),
  time: z.string().optional().describe("Time of day in HH:MM format (defaults to '00:00')"),
});

const DeleteWorkoutSchema = z.object({
  event_id: z.number().describe("The intervals.icu event ID to delete"),
});

// Initialize the MCP server
const server = new Server(
  {
    name: "intervals-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
const TOOLS = [
  {
    name: "get_athlete_settings",
    description:
      "Retrieve athlete's sport settings including FTP, threshold HR, threshold pace, and zones for all configured sports (Ride, Run, Swim, etc.)",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_planned_workouts",
    description:
      "List scheduled workouts/events from the calendar within a date range. Returns workout details including parsed workout structure with steps and targets.",
    inputSchema: {
      type: "object",
      properties: {
        start_date: {
          type: "string",
          description: "Start date in ISO-8601 format (e.g., 2025-12-06)",
        },
        end_date: {
          type: "string",
          description: "End date in ISO-8601 format (e.g., 2025-12-13)",
        },
      },
      required: ["start_date", "end_date"],
    },
  },
  {
    name: "get_completed_activities",
    description:
      "List completed activities within a date range with summary metrics including power, heart rate, training load, and zone distribution.",
    inputSchema: {
      type: "object",
      properties: {
        start_date: {
          type: "string",
          description: "Start date in ISO-8601 format (e.g., 2025-11-01)",
        },
        end_date: {
          type: "string",
          description: "End date in ISO-8601 format (e.g., 2025-12-06)",
        },
      },
      required: ["start_date", "end_date"],
    },
  },
  {
    name: "create_workout",
    description:
      "Create a new scheduled workout on the calendar. Provide both a textual description of the workout's purpose and the intervals.icu workout syntax.",
    inputSchema: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Date for the workout in ISO-8601 format (e.g., 2025-12-08)",
        },
        sport: {
          type: "string",
          description: "Sport type: 'Ride', 'Run', 'Swim', etc.",
        },
        name: {
          type: "string",
          description: "Short workout title (e.g., 'VO₂ 6×2', 'Threshold 4x7')",
        },
        description: {
          type: "string",
          description: "Textual description of workout intent, purpose, and execution cues",
        },
        workout_syntax: {
          type: "string",
          description: "intervals.icu workout syntax (Warmup, Main set, Cooldown with steps)",
        },
        time: {
          type: "string",
          description: "Time of day in HH:MM format (defaults to '00:00')",
        },
      },
      required: ["date", "sport", "name", "description", "workout_syntax"],
    },
  },
  {
    name: "update_workout",
    description:
      "Update an existing scheduled workout by replacing it with a new one. Deletes the old workout and creates a new one with the provided details.",
    inputSchema: {
      type: "object",
      properties: {
        event_id: {
          type: "number",
          description: "The intervals.icu event ID to replace",
        },
        date: {
          type: "string",
          description: "Date for the workout in ISO-8601 format (e.g., 2025-12-08)",
        },
        sport: {
          type: "string",
          description: "Sport type: 'Ride', 'Run', 'Swim', etc.",
        },
        name: {
          type: "string",
          description: "Workout title",
        },
        description: {
          type: "string",
          description: "Prose description of workout intent and purpose",
        },
        workout_syntax: {
          type: "string",
          description: "intervals.icu workout syntax (Warmup, Main set, Cooldown with steps)",
        },
        time: {
          type: "string",
          description: "Time of day in HH:MM format (defaults to '00:00')",
        },
      },
      required: ["event_id", "date", "sport", "name", "description", "workout_syntax"],
    },
  },
  {
    name: "delete_workout",
    description:
      "Delete a scheduled workout from the calendar.",
    inputSchema: {
      type: "object",
      properties: {
        event_id: {
          type: "number",
          description: "The intervals.icu event ID to delete",
        },
      },
      required: ["event_id"],
    },
  },
];

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  log("Tool called", { tool: name, arguments: args });

  try {
    if (name === "get_athlete_settings") {
      // Get all sport settings for the athlete
      const sportSettings = await intervalsApiRequest(
        `/athlete/${INTERVALS_ATHLETE_ID}/sport-settings`
      );

      // Format the response with cleaner schema
      const formattedSettings = sportSettings.map((sport: any) => {
        const result: any = {
          sport: sport.types?.[0] || sport.type, // Primary sport type
          activity_types: sport.types || [sport.type],
        };

        // Power zones (if available)
        if (sport.ftp && sport.power_zones) {
          result.power = {
            ftp: sport.ftp,
            units: "watts",
            zones: sport.power_zones.map((percentage: number, index: number) => {
              const upperBound = Math.round((percentage * sport.ftp) / 100);
              const lowerBound = index === 0 ? 0 : Math.round((sport.power_zones[index - 1] * sport.ftp) / 100);
              return {
                zone: index + 1,
                lower_bound: lowerBound,
                upper_bound: upperBound,
              };
            }),
          };
        }

        // Heart rate zones (if available)
        if (sport.lthr && sport.hr_zones) {
          result.heart_rate = {
            lthr: sport.lthr,
            max: sport.max_hr,
            units: "bpm",
            zones: sport.hr_zones.map((bpm: number, index: number) => ({
              zone: index + 1,
              lower_bound: index === 0 ? 0 : sport.hr_zones[index - 1],
              upper_bound: bpm,
            })),
          };
        }

        // Pace zones (if available)
        if (sport.threshold_pace && sport.pace_zones && sport.pace_units) {
          const convertedThreshold = convertThresholdPace(sport.threshold_pace, sport.pace_units);
          // Pace zones are reversed: Zone 1 = slowest (highest pace values)
          const reversedZones = [...sport.pace_zones].reverse();
          result.pace = {
            threshold_pace: convertedThreshold,
            units: sport.pace_units,
            zones: reversedZones.map((percentage: number, index: number) => {
              // For pace: lower_bound = slower (higher time), upper_bound = faster (lower time)
              const slowerPace = Math.round(((percentage * convertedThreshold!) / 100) * 100) / 100;
              const fasterPace = index === reversedZones.length - 1 ? 0 : Math.round(((reversedZones[index + 1] * convertedThreshold!) / 100) * 100) / 100;
              return {
                zone: index + 1,
                lower_bound: slowerPace,
                upper_bound: fasterPace,
              };
            }),
          };
        }

        return result;
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(formattedSettings, null, 2),
          },
        ],
      };
    } else if (name === "get_planned_workouts") {
      // Validate input
      const parsed = GetPlannedWorkoutsSchema.parse(args);

      // Get planned workouts from events endpoint
      const events = await intervalsApiRequest(
        `/athlete/${INTERVALS_ATHLETE_ID}/events?category=WORKOUT&oldest=${parsed.start_date}&newest=${parsed.end_date}&resolve=true`
      );

      // Format the response with clearer structure
      const formattedWorkouts = events.map((event: any) => {
        const result: any = {
          id: event.id,
          name: event.name,
          description: event.description,
          start_date: event.start_date_local,
          category: event.category,
        };

        if (event.workout_doc) {
          const doc = event.workout_doc;
          result.workout = {
            description: doc.description,
            duration_seconds: doc.duration,
            distance_meters: doc.distance,
            target_type: doc.target, // POWER, HR, PACE, AUTO
          };

          // Add power settings if applicable
          if (doc.ftp) {
            result.workout.power = {
              ftp: doc.ftp,
              units: "watts",
            };
          }

          // Add heart rate settings if applicable
          if (doc.lthr) {
            result.workout.heart_rate = {
              lthr: doc.lthr,
              units: "bpm",
            };
          }

          // Add pace settings if applicable
          if (doc.threshold_pace && doc.pace_units) {
            result.workout.pace = {
              threshold_pace: convertThresholdPace(doc.threshold_pace, doc.pace_units),
              units: doc.pace_units,
            };
          }

          // Include workout steps
          result.workout.steps = doc.steps;
        }

        return result;
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(formattedWorkouts, null, 2),
          },
        ],
      };
    } else if (name === "get_completed_activities") {
      // Validate input
      const parsed = GetCompletedActivitiesSchema.parse(args);

      // Get completed activities
      const activities = await intervalsApiRequest(
        `/athlete/${INTERVALS_ATHLETE_ID}/activities?oldest=${parsed.start_date}&newest=${parsed.end_date}`
      );

      // Format the response with clearer structure and units
      const formattedActivities = activities.map((activity: any) => {
        const result: any = {
          id: activity.id,
          name: activity.name,
          description: activity.description,
          start_date: activity.start_date_local,
          type: activity.type,
        };

        // Time and distance
        result.duration = {
          moving_time_seconds: activity.moving_time,
          elapsed_time_seconds: activity.elapsed_time,
        };

        if (activity.distance) {
          result.distance_meters = activity.distance;
        }

        if (activity.elevation_gain) {
          result.elevation_gain_meters = activity.elevation_gain;
        }

        // Power metrics (if available)
        if (activity.icu_average_watts || activity.icu_weighted_avg_watts) {
          result.power = {
            units: "watts",
          };
          if (activity.icu_average_watts) {
            result.power.average = activity.icu_average_watts;
          }
          if (activity.icu_weighted_avg_watts) {
            result.power.normalized = activity.icu_weighted_avg_watts;
          }
          if (activity.icu_variability_index) {
            result.power.variability_index = Math.round(activity.icu_variability_index * 100) / 100;
          }
          if (activity.icu_efficiency_factor) {
            result.power.efficiency_factor = Math.round(activity.icu_efficiency_factor * 100) / 100;
          }
          if (activity.icu_power_hr) {
            result.power.power_hr_ratio = Math.round(activity.icu_power_hr * 100) / 100;
          }
          if (activity.icu_intensity !== null && activity.icu_intensity !== undefined) {
            result.power.intensity_percent = Math.round(activity.icu_intensity);
          }
          if (activity.icu_ftp) {
            result.power.ftp_at_time_of_activity = activity.icu_ftp;
          }
          if (activity.avg_lr_balance) {
            result.power.left_right_balance = {
              left_percent: Math.round(activity.avg_lr_balance * 10) / 10,
              right_percent: Math.round((100 - activity.avg_lr_balance) * 10) / 10,
            };
          }
        }

        // Heart rate metrics (if available)
        if (activity.average_heartrate || activity.max_heartrate) {
          result.heart_rate = {
            units: "bpm",
          };
          if (activity.average_heartrate) {
            result.heart_rate.average = activity.average_heartrate;
          }
          if (activity.max_heartrate) {
            result.heart_rate.max = activity.max_heartrate;
          }
        }

        // Cadence (if available)
        if (activity.average_cadence) {
          result.cadence = {
            average: activity.average_cadence,
            units: "rpm",
          };
        }

        // Training load - use primary metric based on activity
        result.training_load = {
          value: activity.icu_training_load,
        };
        if (activity.tss) {
          result.training_load.tss = activity.tss; // Training Stress Score (power-based)
        }
        if (activity.trimp) {
          result.training_load.trimp = activity.trimp; // Training Impulse (HR-based)
        }

        // Work and energy metrics (power-based activities)
        if (activity.icu_joules) {
          result.work = {
            total_kilojoules: Math.round(activity.icu_joules / 1000),
          };
          if (activity.icu_joules_above_ftp) {
            result.work.kilojoules_above_ftp = Math.round(activity.icu_joules_above_ftp / 1000);
          }
          if (activity.icu_max_wbal_depletion) {
            result.work.max_wbal_depletion_kilojoules = Math.round(activity.icu_max_wbal_depletion / 1000 * 10) / 10;
          }
        }

        // Additional metrics
        if (activity.calories) {
          result.calories = activity.calories;
        }
        if (activity.carbs_used) {
          result.carbs_used_grams = activity.carbs_used;
        }
        if (activity.compliance !== null && activity.compliance !== undefined) {
          result.workout_compliance_percent = Math.round(activity.compliance * 10) / 10;
        }
        if (activity.decoupling !== null && activity.decoupling !== undefined) {
          result.aerobic_decoupling_percent = Math.round(activity.decoupling * 10) / 10;
        }
        if (activity.polarization_index !== null && activity.polarization_index !== undefined) {
          result.polarization_index = Math.round(activity.polarization_index * 100) / 100;
        }

        // Zone distribution (convert to structured format)
        if (activity.icu_zone_times && activity.icu_zone_times.length > 0) {
          result.power_zone_distribution = activity.icu_zone_times
            .filter((z: any) => z.id.startsWith('Z')) // Only zones, not SS (sweet spot)
            .map((z: any) => ({
              zone: parseInt(z.id.substring(1)), // Extract zone number from "Z1", "Z2", etc.
              time_seconds: z.secs,
            }));
        }

        if (activity.icu_hr_zone_times && activity.icu_hr_zone_times.length > 0) {
          result.heart_rate_zone_distribution = activity.icu_hr_zone_times.map((seconds: number, index: number) => ({
            zone: index + 1,
            time_seconds: seconds,
          }));
        }

        if (activity.pace_zone_times && activity.pace_zone_times.length > 0) {
          result.pace_zone_distribution = activity.pace_zone_times.map((seconds: number, index: number) => ({
            zone: index + 1,
            time_seconds: seconds,
          }));
        }

        return result;
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(formattedActivities, null, 2),
          },
        ],
      };
    } else if (name === "create_workout") {
      // Validate input
      const parsed = CreateWorkoutSchema.parse(args);

      // Build start_date_local in ISO-8601 format
      const time = parsed.time || "00:00";
      const startDateLocal = `${parsed.date}T${time}:00`;

      // Concatenate description and workout syntax
      const fullDescription = `${parsed.description}\n\n${parsed.workout_syntax}`;

      // Create the workout event
      const requestBody = [
        {
          category: "WORKOUT",
          start_date_local: startDateLocal,
          type: parsed.sport,
          name: parsed.name,
          description: fullDescription,
        },
      ];

      const response = await intervalsApiRequest(
        `/athlete/0/events/bulk?upsert=true`,
        "POST",
        requestBody
      );

      // Clean up the response
      const event = response[0];
      const result = {
        event_id: event.id,
        date: parsed.date,
        sport: parsed.sport,
        name: parsed.name,
        description: parsed.description, // Return only the prose description, not the syntax
        created: true,
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } else if (name === "update_workout") {
      // Validate input
      const parsed = UpdateWorkoutSchema.parse(args);

      // Step 1: Delete the old workout
      log("update_workout: Deleting old event", { event_id: parsed.event_id });

      const deleteResponse = await intervalsApiRequest(
        `/athlete/0/events/bulk-delete`,
        "PUT",
        [{ id: parsed.event_id }]
      );

      // Check if deletion succeeded - use robust parsing
      log("update_workout: Delete response", {
        response: deleteResponse,
        responseType: typeof deleteResponse,
      });

      let deletedCount = 0;
      if (typeof deleteResponse === "number") {
        deletedCount = deleteResponse;
      } else if (typeof deleteResponse === "string") {
        deletedCount = parseInt(deleteResponse, 10) || 0;
      } else if (deleteResponse && typeof deleteResponse === "object" && !Array.isArray(deleteResponse)) {
        deletedCount = deleteResponse.eventsDeleted ?? deleteResponse.deleted ?? deleteResponse.count ?? deleteResponse.deletedCount ?? 0;
      }

      log("update_workout: Parsed delete count", { deletedCount });

      if (deletedCount < 1) {
        throw new Error(
          `Failed to delete workout with event_id ${parsed.event_id}. The workout may not exist.`
        );
      }

      log("update_workout: Old event deleted successfully", { event_id: parsed.event_id, deletedCount });

      // Step 2: Create the new workout
      log("update_workout: Creating new event", {
        date: parsed.date,
        sport: parsed.sport,
        name: parsed.name
      });

      try {
        // Build start_date_local in ISO-8601 format
        const time = parsed.time || "00:00";
        const startDateLocal = `${parsed.date}T${time}:00`;

        // Concatenate description and workout syntax
        const fullDescription = `${parsed.description}\n\n${parsed.workout_syntax}`;

        // Create the workout event
        const requestBody = [
          {
            category: "WORKOUT",
            start_date_local: startDateLocal,
            type: parsed.sport,
            name: parsed.name,
            description: fullDescription,
          },
        ];

        const createResponse = await intervalsApiRequest(
          `/athlete/0/events/bulk?upsert=true`,
          "POST",
          requestBody
        );

        // Clean up the response
        const event = createResponse[0];
        const result = {
          old_event_id: parsed.event_id,
          new_event_id: event.id,
          date: parsed.date,
          sport: parsed.sport,
          name: parsed.name,
          description: parsed.description,
          updated: true,
        };

        log("update_workout: New event created successfully", {
          old_event_id: parsed.event_id,
          new_event_id: event.id
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (createError) {
        // If create fails after successful delete, we're in a bad state
        const errorMessage = createError instanceof Error ? createError.message : String(createError);
        log("update_workout: CRITICAL - Delete succeeded but create failed", {
          old_event_id: parsed.event_id,
          error: errorMessage,
        });

        throw new Error(
          `CRITICAL: Workout ${parsed.event_id} was deleted but failed to create replacement. ` +
          `Original workout is lost. Error: ${errorMessage}`
        );
      }
    } else if (name === "delete_workout") {
      // Validate input
      const parsed = DeleteWorkoutSchema.parse(args);

      // Delete the workout
      const response = await intervalsApiRequest(
        `/athlete/0/events/bulk-delete`,
        "PUT",
        [{ id: parsed.event_id }]
      );

      // Log the raw response for debugging
      log("delete_workout raw response", {
        response,
        responseType: typeof response,
        responseValue: response,
        isNumber: typeof response === "number",
        isObject: typeof response === "object",
        isNull: response === null,
        isUndefined: response === undefined,
      });

      // The API returns a plain integer (the count of deleted events)
      // Parse it carefully to handle various response formats
      let deletedCount = 0;

      if (typeof response === "number") {
        // Response is a number (expected case)
        deletedCount = response;
        log("delete_workout parsed as number", { deletedCount });
      } else if (typeof response === "string") {
        // Response might be a string representation of a number
        deletedCount = parseInt(response, 10) || 0;
        log("delete_workout parsed from string", { original: response, deletedCount });
      } else if (response && typeof response === "object" && !Array.isArray(response)) {
        // Response is an object with a count field
        deletedCount = response.eventsDeleted ?? response.deleted ?? response.count ?? response.deletedCount ?? 0;
        log("delete_workout parsed from object", { response, deletedCount });
      } else if (response === null || response === undefined) {
        // Response is null or undefined
        deletedCount = 0;
        log("delete_workout response is null/undefined");
      } else {
        // Unknown response format
        log("delete_workout unknown response format", { response, type: typeof response });
        deletedCount = 0;
      }

      const result = {
        event_id: parsed.event_id,
        deleted: deletedCount >= 1,
      };

      log("delete_workout final result", result);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } else {
      throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    // Log errors to stderr
    console.error(`Error executing tool ${name}:`, error);

    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr
  console.error("intervals.icu MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});

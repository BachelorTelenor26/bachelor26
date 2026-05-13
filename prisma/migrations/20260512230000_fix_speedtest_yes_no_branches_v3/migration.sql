WITH target_steps AS (
  SELECT s."id" AS step_id
  FROM "Step" s
  JOIN "Article" a ON a."id" = s."articleId"
  WHERE s."localeKey" = 'tregt-nett/shared/hastighetstest'
    AND a."slug" IN (
      'tregt_nett_nei_huawei_b818',
      'tregt_nett_nei_jeg_har_en_annen_ruter',
      'tregt_nett_nei_zyxel_p8702n'
    )
),
current_yes AS (
  SELECT
    sc."id",
    sc."stepId",
    sc."label",
    sc."buttonText",
    sc."value",
    sc."nextStepId",
    sc."sortOrder"
  FROM "StepChoice" sc
  WHERE sc."stepId" IN (SELECT step_id FROM target_steps)
    AND sc."sortOrder" = 1
),
updated_yes AS (
  UPDATE "StepChoice" sc
  SET
    "nextStepId" = NULL,
    "isTerminal" = TRUE,
    "terminalReason" = 'FLOW_EXIT_EXPECTED_SPEED',
    "updatedAt" = now()
  FROM current_yes cy
  WHERE sc."id" = cy."id"
  RETURNING sc."id"
)
INSERT INTO "StepChoice" (
  "id",
  "stepId",
  "label",
  "buttonText",
  "value",
  "nextStepId",
  "sortOrder",
  "isTerminal",
  "terminalReason",
  "createdAt",
  "updatedAt"
)
SELECT
  'speedfix_' || substr(md5(random()::text || clock_timestamp()::text || cy."stepId"), 1, 24) AS id,
  cy."stepId",
  replace(cy."label", '.choice_1.label', '.choice_2.label') AS label,
  cy."buttonText",
  cy."value",
  cy."nextStepId",
  2 AS "sortOrder",
  FALSE AS "isTerminal",
  NULL::"TerminalReason" AS "terminalReason",
  now() AS "createdAt",
  now() AS "updatedAt"
FROM current_yes cy
WHERE cy."nextStepId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "StepChoice" existing2
    WHERE existing2."stepId" = cy."stepId"
      AND existing2."sortOrder" = 2
  );

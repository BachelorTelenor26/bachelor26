UPDATE "StepChoice" sc
SET "terminalReason" = 'SPEEDTEST'
FROM "Step" s
WHERE sc."stepId" = s."id"
  AND s."localeKey" = 'tregt-nett/shared/hastighetstest'
  AND sc."sortOrder" = 0;

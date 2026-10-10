# Evidence review of every original assumption

Reviewed 2026-10-10. All 37 fields originally marked assumption in external-cases v1. Source-backed mappings remain interpretations. Analogous cases never establish original-company facts.

**10 partial**, **14 unresolved**, **7 supported**, **6 corrected**.

Supported = reasonable source-to-question mapping. Corrected = evidence changed the encoded value. Partial = some support but the full value remains uncertain. Unresolved = no adequate evidence for the exact value. No status denotes independently verified customer behavior.

Six values were corrected: Adyen volume, risks and deployment; Remote quality; Kensho quality; Discord volume. Source-backed values remain provisional pending expert review.

The UI defines daily as dozens/day, high as hundreds/day or more, and partly as partly a matter of taste. A daily schedule and unpublished criteria do not justify those defaults.

## Comparable cases

[Koralplay](https://n8n.io/case-studies/koralplay/) reports over 4,000 weekly workflow executions and multiple support/reporting workflows. This supports testing high volume and routing as alternatives, not assigning its traffic to another company.

[ITNT Media Group](https://n8n.io/case-studies/itnt-media-group/) describes self-hosted automation and selective use of cloud models. This challenges the shortcut that cloud services imply unrestricted hosting. Its constraints cannot be transferred to another customer.

## Bordr

| Assumption | Result | Evidence and limits |
| --- | --- | --- |
| `trigger`: "event" | partial | Order and document status changes drive the described business process. **Limit:** The exact trigger mechanism is not stated; events and polling schedules remain plausible. [Bordr original case](https://n8n.io/case-studies/bordr/) |
| `volume`: "daily" | unresolved | The source reports growing order demand, without executions per day. **Limit:** Revenue is not run volume. The retained daily value means dozens/day and is only hypothetical. [Bordr original case](https://n8n.io/case-studies/bordr/) |
| `risks`: ["personal", "visible"] | supported | Identity documents and customer emails support personal and visible flags. **Limit:** This is an engineering interpretation, not an exhaustive risk assessment. [Bordr required documents](https://support.bordr.com/article/27-what-documents-do-i-need-to-apply-for-a-nif); [Bordr original case](https://n8n.io/case-studies/bordr/) |
| `location`: "open" | unresolved | Reviewed the case and service privacy policy; neither establishes unrestricted workflow deployment. **Limit:** Third-party apps do not establish permission to use arbitrary hosting or model providers. [Bordr original case](https://n8n.io/case-studies/bordr/); [Bordr privacy policy](https://bordr.com/privacy-policy) |
| `team`: "mid" | partial | The founder ran a web design business and built multi-step integrations. **Limit:** This suggests technical comfort; the exact mid-level operator capability is not verified. [Bordr original case](https://n8n.io/case-studies/bordr/) |

## Oversee

| Assumption | Result | Evidence and limits |
| --- | --- | --- |
| `shape`: "judgement" | supported | The scoped workflow retrieves context and uses AI to assemble a report for staff. **Limit:** Judgement is a reasonable mapping of that bounded workflow; it is not the entire support process. [Oversee original case](https://n8n.io/case-studies/oversee/) |
| `volume`: "daily" | unresolved | Day-to-day use is reported, but not the count of investigation runs. **Limit:** Daily use does not prove dozens/day. [Oversee original case](https://n8n.io/case-studies/oversee/) |
| `risks`: ["personal"] | supported | Support records include identity and contact information, supporting the personal flag. **Limit:** Exact fields accessible to the n8n workflow are not documented. [Oversee privacy policy](https://oversee.biz/privacy-policy/); [Oversee original case](https://n8n.io/case-studies/oversee/) |
| `location`: "open" | unresolved | The service policy covers handling of customer information. **Limit:** It does not specify permissible n8n hosting or model processing locations. [Oversee privacy policy](https://oversee.biz/privacy-policy/); [Oversee original case](https://n8n.io/case-studies/oversee/) |
| `kinds`: "no" | unresolved | The case describes investigation/reporting without a support request taxonomy. **Limit:** No is an unverified simplification, not proof that routing is unnecessary. [Oversee original case](https://n8n.io/case-studies/oversee/) |
| `quality`: "partly" | unresolved | Reports assemble case information, but a report acceptance rubric is unpublished. **Limit:** Partly means subjective quality in the UI. Publication silence does not establish subjectivity; retain only as a sensitivity baseline. [Oversee original case](https://n8n.io/case-studies/oversee/) |
| `knowledge`: ["reference"] | partial | The workflow consults a case database and historical context. **Limit:** Reference inputs are supported; reference-only sufficiency and absence of learned memory are not established. [Oversee original case](https://n8n.io/case-studies/oversee/) |
| `split`: "sequential" | partial | Context collection logically precedes delivery of the structured report. **Limit:** The article does not rule out parallel retrieval; sequential is a top-level abstraction. [Oversee original case](https://n8n.io/case-studies/oversee/) |

## Adyen

| Assumption | Result | Evidence and limits |
| --- | --- | --- |
| `systems`: "act" | supported | Jobs generate data and the custom backfill plugin clears generated data. **Limit:** Act describes writes and deletions, not just reads. [Adyen original case](https://airflow.apache.org/use-cases/adyen/) |
| `volume`: "daily" → "high" | corrected | Thousands of regularly executing tasks support high aggregate orchestration volume. **Limit:** This mapping covers the described fleet, not the frequency of any single DAG. [Adyen journey to reliability](https://www.adyen.com/knowledge-hub/apache-airflow-at-adyen) |
| `risks`: ["none"] → ["personal", "visible", "irreversible"] | corrected | Merchant-facing payment reports and destructive custom backfills support visible, confidential-data and costly-error risks. **Limit:** Flags are our interpretation of the scoped fleet; they do not imply every task performs a payment. [Adyen journey to reliability](https://www.adyen.com/knowledge-hub/apache-airflow-at-adyen); [Adyen original case](https://airflow.apache.org/use-cases/adyen/) |
| `location`: "open" → "residency" | corrected | The platform lineage required on-premise operation; infrastructure policy describes company-managed servers and payment-data locations. **Limit:** Residency is the closest available encoding of controlled deployment. Historical evidence and wider policy do not specify every current Airflow DAG. [Adyen data science platform](https://www.adyen.com/knowledge-hub/building-our-data-science-platform-with-spark-and-jupyter); [Adyen infrastructure](https://www.adyen.com/en_AU/infrastructure) |

## Adobe

| Assumption | Result | Evidence and limits |
| --- | --- | --- |
| `systems`: "act" | supported | The service creates workflow files, updates metadata and launches jobs. **Limit:** These are write/execute operations. [Adobe orchestration engineering](https://medium.com/adobetech/adobe-experience-platform-orchestration-service-with-apache-airflow-952203723c0b) |
| `volume`: "daily" | unresolved | The engineering account explicitly describes varying frequency and concurrency. **Limit:** Concurrent task capacity does not prove a daily execution count for this scoped workload. [Adobe orchestration engineering](https://medium.com/adobetech/adobe-experience-platform-orchestration-service-with-apache-airflow-952203723c0b) |
| `risks`: ["none"] | unresolved | Authentication, authorization and workload isolation are documented. **Limit:** These controls do not establish that all outputs are internal/easy to fix; none remains an unverified baseline. [Adobe orchestration engineering](https://medium.com/adobetech/adobe-experience-platform-orchestration-service-with-apache-airflow-952203723c0b) |
| `location`: "open" | unresolved | The historical service runs on Azure with separated service clusters. **Limit:** Observed cloud deployment does not prove unrestricted deployment permission. [Adobe orchestration engineering](https://medium.com/adobetech/adobe-experience-platform-orchestration-service-with-apache-airflow-952203723c0b) |

## Remote

| Assumption | Result | Evidence and limits |
| --- | --- | --- |
| `trigger`: "manual" | partial | Customers upload files and staff supply them to the migration agent. **Limit:** This does not settle whether execution begins with a manual request or an upload event. [Remote original case](https://www.langchain.com/blog/customers-remote) |
| `volume`: "daily" | unresolved | Customer and file counts are described without migration executions/day. **Limit:** Thousands of customers is not daily run volume. [Remote original case](https://www.langchain.com/blog/customers-remote) |
| `location`: "open" | unresolved | The company describes governed third-party AI use and secure migration storage. **Limit:** Policy does not identify migration-specific locations or permit arbitrary providers. [Remote privacy policy](https://remote.com/policy/privacy-policy); [Remote original case](https://www.langchain.com/blog/customers-remote) |
| `kinds`: "no" | partial | The scoped goal is one migration outcome across CSV, Excel and SQL formats. **Limit:** Different formats may require routed parsing; a single goal does not prove one handling path. [Remote original case](https://www.langchain.com/blog/customers-remote) |
| `quality`: "partly" → "clear" | corrected | An explicit destination schema and validated JSON support checklist-based acceptance. **Limit:** Schema validity alone does not prove semantic correctness; field/value reconciliation still needs testing. [Remote original case](https://www.langchain.com/blog/customers-remote) |
| `knowledge`: ["reference"] | partial | The target onboarding schema supplies concrete reference material. **Limit:** Published details do not establish whether reference alone suffices or additional playbooks are used. [Remote original case](https://www.langchain.com/blog/customers-remote) |

## Kensho

| Assumption | Result | Evidence and limits |
| --- | --- | --- |
| `trigger`: "manual" | partial | Interactive and service-account API access are both documented. **Limit:** Manual is one scenario; calling applications can trigger retrieval automatically. [Kensho Adaptive Retrieval API](https://docs.kensho.com/adaptive-retrieval/api-guide); [Kensho engineering account](https://kensho.com/news/how-kensho-built-a-multi-agent-framework-with-langgraph-to-solve-trusted-financial-data-retrieval) |
| `volume`: "daily" | unresolved | The articles/API guide do not publish absolute query executions per day. **Limit:** Enterprise scale and API availability are not traffic measurements. [Kensho engineering account](https://kensho.com/news/how-kensho-built-a-multi-agent-framework-with-langgraph-to-solve-trusted-financial-data-retrieval); [Kensho Adaptive Retrieval API](https://docs.kensho.com/adaptive-retrieval/api-guide) |
| `risks`: ["visible"] | supported | Clients receive citation-backed financial answers, supporting visible output. **Limit:** The flag is not an exhaustive characterization of data licensing or confidentiality. [Kensho engineering account](https://kensho.com/news/how-kensho-built-a-multi-agent-framework-with-langgraph-to-solve-trusted-financial-data-retrieval) |
| `location`: "open" | unresolved | The API requires authentication and documents controlled dataset access. **Limit:** Access control does not establish geographic hosting or provider constraints. [Kensho Adaptive Retrieval API](https://docs.kensho.com/adaptive-retrieval/api-guide) |
| `quality`: "partly" → "clear" | corrected | Routing, exact-match retrieval and completeness are explicitly evaluated. **Limit:** That supports clear criteria; it does not prove complete coverage or perfect reliability. [Kensho engineering account](https://kensho.com/news/how-kensho-built-a-multi-agent-framework-with-langgraph-to-solve-trusted-financial-data-retrieval) |
| `knowledge`: ["reference"] | partial | Verified datasets are essential retrieval references. **Limit:** The publications do not establish reference-only sufficiency or rule out additional playbooks. [Kensho engineering account](https://kensho.com/news/how-kensho-built-a-multi-agent-framework-with-langgraph-to-solve-trusted-financial-data-retrieval); [Kensho Adaptive Retrieval API](https://docs.kensho.com/adaptive-retrieval/api-guide) |

## Discord

| Assumption | Result | Evidence and limits |
| --- | --- | --- |
| `systems`: "act" | supported | Table materializations and production merges write derived data. **Limit:** Act is appropriate for the scoped data operations. [Discord original case](https://discord.com/blog/how-discord-uses-open-source-tools-for-scalable-data-orchestration-transformation) |
| `volume`: "daily" → "high" | corrected | The article reports about 4,000 daily materializations. **Limit:** High applies to the described aggregate system, not necessarily one table. [Discord original case](https://discord.com/blog/how-discord-uses-open-source-tools-for-scalable-data-orchestration-transformation) |
| `risks`: ["none"] | partial | The article describes production merge races and consistency-sensitive backfills. **Limit:** None is not supported. Precise cost/reversibility is unknown, so compare costly-error and confidential-data scenarios. [Discord original case](https://discord.com/blog/how-discord-uses-open-source-tools-for-scalable-data-orchestration-transformation) |
| `location`: "open" | unresolved | The system uses Kubernetes, BigQuery and Dagster hybrid cloud. **Limit:** Those choices do not disclose all location restrictions; cloud use is not unrestricted permission. [Discord original case](https://discord.com/blog/how-discord-uses-open-source-tools-for-scalable-data-orchestration-transformation) |

## Research boundaries

- Re-read all seven original cases and searched company-authored engineering, support, API and privacy publications.
- Targeted searches covered Bordr order triggers/operator background; Oversee support/security; Adyen data-platform scale/hosting; Adobe orchestration; Remote migration/AI handling; Kensho API/quality/traffic; Discord operations.
- Privacy pages provide handling context only; this is not a legal interpretation or evidence of unrestricted deployment.
- Kensho overview was returned in search but direct opens failed twice; it is not a validated link in this ledger. The opened API guide and engineering article provide the cited evidence.
- Koralplay provides a concrete high-volume and routed support comparison; ITNT documents controlled self-hosting with selective cloud-model use. Neither proves Bordr or Oversee has identical constraints.
- No exact source was found for remaining unknowns in this bounded research pass. Absence of published evidence is not evidence of absence.

The machine-readable ledger includes section locators, source scope, original/current values and alternatives. Uncertainty variants change one field at a time; they are hypothetical probes, not additional observed customer cases.

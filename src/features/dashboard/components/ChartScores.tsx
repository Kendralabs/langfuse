import { api } from "@/src/utils/api";
import {
  dateTimeAggregationSettings,
  type DateTimeAggregationOption,
} from "@/src/features/dashboard/lib/timeseries-aggregation";
import { BaseTimeSeriesChart } from "@/src/features/dashboard/components/BaseTimeSeriesChart";
import { DashboardCard } from "@/src/features/dashboard/components/cards/DashboardCard";
import { type FilterState } from "@/src/features/filters/types";
import {
  extractTimeSeriesData,
  fillMissingValuesAndTransform,
  isEmptyTimeSeries,
} from "@/src/features/dashboard/components/hooks";
import { NoData } from "@/src/features/dashboard/components/NoData";
import DocPopup from "@/src/components/layouts/doc-popup";

export function ChartScores(props: {
  className?: string;
  agg: DateTimeAggregationOption;
  globalFilterState: FilterState;
  projectId: string;
}) {
  const scores = api.dashboard.chart.useQuery({
    projectId: props.projectId,
    from: "traces_scores",
    select: [{ column: "scoreName" }, { column: "value", agg: "AVG" }],
    filter:
      props.globalFilterState.map((f) =>
        f.type === "datetime" ? { ...f, column: "timestamp" } : f,
      ) ?? [],
    groupBy: [
      {
        type: "datetime",
        column: "timestamp",
        temporalUnit: dateTimeAggregationSettings[props.agg].date_trunc,
      },
      {
        type: "string",
        column: "scoreName",
      },
    ],
  });

  const extractedScores = scores.data
    ? fillMissingValuesAndTransform(
        extractTimeSeriesData(scores.data, "timestamp", [
          {
            labelColumn: "scoreName",
            valueColumn: "avgValue",
          },
        ]),
      )
    : [];

  return (
    <DashboardCard
      className={props.className}
      title="Scores"
      description="Average score per name"
      isLoading={scores.isLoading}
    >
      {!isEmptyTimeSeries(extractedScores) ? (
        <BaseTimeSeriesChart
          agg={props.agg}
          data={extractedScores ?? []}
          connectNulls
        />
      ) : (
        <NoData noDataText="No data">
          <DocPopup
            description="Scores evaluate LLM quality and can be created manually or using the SDK."
            link="https://langfuse.com/docs/scores"
          />
        </NoData>
      )}
    </DashboardCard>
  );
}

let future_asl = ""
let fluency_asl = ""
let future_sl = ""
let fluency_sl = ""

// range sliders const
const spend_extent = [1000, 10000];
const account_extent = [20, 2000];
const salary_extent = [75000, 150000];
const team_extent = [10, 250];
// chart const
const width = 64 * 7;
const height = 64 * 5;
const marginTop = 88;
const marginRight = 64;
const marginBottom = 16;
const marginLeft = 64;

let old_growth = 2.5;

const get_color = (v) => getComputedStyle(document.documentElement).getPropertyValue(v);
const rate_scale = d3.scaleLinear(spend_extent, [0.025, 0.01]);
const growth_stops = [...Array(31).keys()].map((n) => (n + 10) / 10).slice(5);  // 1.5 - 4 by .1 steps

const update_chart = () => {
  let chart_data = growth_stops.map(growth => {
    let current_labor_cost = (range_data.team_salary / 12) * range_data.team_size;

    let future_accounts = Math.floor(range_data.account_count * growth);
    let future_monthly = current_labor_cost * growth;

    let fluency_rate = rate_scale(range_data.account_spend); // between 1 - 2.5%
    let fluency_cost = range_data.account_spend * fluency_rate;
    let fluency_per_account = current_labor_cost / future_accounts + fluency_cost;
    let future_per_account = future_monthly / future_accounts;
    let savings_per_account = future_per_account - fluency_per_account;
    let savings_per_month = future_accounts * savings_per_account;
    let fluency_monthly = future_monthly - savings_per_month;

    return {
      growth,
      future_accounts,
      future_per_account,
      future_monthly,
      fluency_per_account,
      fluency_monthly,
      fluency_rate,
      savings_per_account,
      savings_per_month
    };
  });

  d3.select("#calc_chart svg").remove();
  const line_chart = d3
    .select('#calc_chart')
    .append("svg")
    .attr("width", width)
    .attr("viewBox", [0, 0, width, height])
    .attr(
      "style",
      "max-width: 100%; height: auto; cursor: pointer;"
    );

  const x = d3.scaleLinear(
    d3.extent(chart_data, (d) => d.growth),
    [marginLeft, width - marginRight]
  );

  const xrev = d3.scaleLinear(
    [marginLeft, width - marginRight],
    d3.extent(chart_data, (d) => d.growth)
  );

  const y = d3.scaleLinear(
    [0, d3.max(chart_data, (d) => d.future_monthly)],
    [height - marginBottom, marginTop]
  );

  const fluency_line = d3
    .line()
    .x((d) => x(d.growth))
    .y((d) => y(d.fluency_monthly));

  const future_line = d3
    .line()
    .x((d) => x(d.growth))
    .y((d) => y(d.future_monthly));

  const area = d3
    .area()
    .x((d) => x(d.growth))
    .y0((d) => y(d.future_monthly))
    .y1((d) => y(d.fluency_monthly));

  line_chart
    .append("defs")
    .html(`<linearGradient id="area_gradient" gradientTransform="rotate(90)">
        <stop offset="30%" stop-color="${get_color("--pale-sun")}"/>
        <stop offset="89.5%" stop-color="${get_color("--violet")}"/>
        </linearGradient>`);

  line_chart
    .append("defs")
    .html(`<linearGradient id="future_bar_gradient" gradientTransform="rotate(90)">
        <stop offset="19%" stop-color="${get_color("--pale-sun")}"/>
        <stop offset="89.5%" stop-color="#f19a5f"/>
        </linearGradient>`);

  line_chart
    .append("defs")
    .html(`<linearGradient id="flue_bar_gradient" gradientTransform="rotate(90)">
        <stop offset="19%" stop-color="${get_color("--violet")}"/>
        <stop offset="89.5%" stop-color="#785D80"/>
        </linearGradient>`);

  // y axis
  line_chart
    .append("g")
    .attr("transform", `translate(48, 0)`)
    .call(d3.axisLeft(y).ticks(4).tickFormat(d3.format("$.2s")))
    .call((g) => g.select(".domain").remove())
    .call((g) =>
      g
        .selectAll(".tick line")
        .clone()
        .attr("x2", width - marginLeft)
        .attr("stroke-opacity", 0.2)
    );

  // lines 
  const lines = line_chart
    .append("g")
    .attr("id", "lines_group")

  // draggable growth
  const movables = line_chart
    .append("g")
    .attr("id", "moveables")

  movables
    .attr("id", "growth_line")
    .append("line")
    .attr("stroke", "var(--light-grey)")
    .attr("stroke-width", 2)
    .attr("opacity", 0.5)
    .attr("x1", 0)
    .attr("x2", 0)
    .attr("y1", marginTop + 8)
    .attr("y2", height - marginBottom - 8)

  movables
    .append("circle")
    .attr("r", 24)
    .attr("cx", 0)
    .attr("cy", 30)
    .attr("fill", "#FFFFFF")

  const growth_txt = movables
    .append("text")
    .attr("fill", "#000")
    .attr("font-size", 20)
    .attr("font-weight", "bold")
    .attr("x", 0)
    .attr("text-anchor", "middle")
    .attr("y", 36)

  // growth label
  movables
    .append("text")
    .attr("fill", "#FFF")
    .attr("font-size", 14)
    .attr("font-family", "Leaguemono")
    .attr("x", 0)
    .attr("text-anchor", "middle")
    .attr("y", 36 + 36)
    .text("YOUR GROWTH GOAL")

  movables
    .append("text")
    .attr("fill", "#FFF")
    .attr("font-size", 14)
    .attr("font-family", "Leaguemono")
    .attr("x", 30)
    .attr("text-anchor", "start")
    .attr("y", 34)
    .text(">")

  movables
    .append("text")
    .attr("fill", "#FFF")
    .attr("font-size", 14)
    .attr("font-family", "Leaguemono")
    .attr("x", -30)
    .attr("text-anchor", "end")
    .attr("y", 34)
    .text("<")

  lines
    .append("path")
    .attr("fill", "none")
    .attr("stroke-linecap", "round")
    .attr("stroke", get_color("--midnight"))
    .attr("stroke-width", 8)
    .attr("d", fluency_line(chart_data));

  lines
    .append("path")
    .attr("fill", "none")
    .attr("stroke", get_color("--midnight"))
    .attr("stroke-linecap", "round")
    .attr("stroke-width", 8)
    .attr("d", future_line(chart_data));

  // area mask
  const clipper = line_chart
    .append("clipPath")
    .attr("id", "mask")
    .append("rect")
    .attr("x", marginLeft - 6)
    .attr("y", marginTop)
    .attr("height", height - marginBottom);

  lines
    .append("path")
    .attr("fill", "url(#area_gradient)")
    .attr("clip-path", "url(#mask)")
    .attr("id", "area_fill")
    .attr("d", area(chart_data));

  lines
    .append("path")
    .attr("fill", "none")
    .attr("stroke-linecap", "round")
    .attr("stroke", get_color("--violet"))
    .attr("stroke-width", 8)
    .attr("clip-path", "url(#mask)")
    .attr("d", fluency_line(chart_data));

  lines
    .append("path")
    .attr("fill", "none")
    .attr("stroke", get_color("--pale-sun"))
    .attr("stroke-linecap", "round")
    .attr("stroke-width", 8)
    .attr("clip-path", "url(#mask)")
    .attr("d", future_line(chart_data));

  // savings
  const fluency_circle =
    line_chart
      .append('circle')
      .attr("r", 12)
      .attr("fill", "#785D80")

  const future_circle =
    line_chart
      .append('circle')
      .attr("r", 12)
      .attr("fill", "#f19a5f")

  const savings_movable = line_chart
    .append("g")
    .attr("id", "savings_movable")
    .attr("text-anchor", "end")

  const savings_txt = savings_movable
    .append("text")
    .attr("fill", "#fff")
    .attr("font-size", 36)
    .attr("font-weight", "bold")
    .attr("x", width / 2)
    .attr("style", `transform:rotate(-8deg)`)

  savings_movable
    .append("text")
    .attr("fill", "var(--violet)")
    .attr("font-size", 14)
    .attr("font-family", "Leaguemono")
    .text("SAVINGS PER MONTH")
    .attr("x", width / 2)
    .attr("y", 24)
    .attr("style", `transform:rotate(-8deg)`)

  /////////////////
  /// bar chart ///
  /////////////////

  d3.select("#calc_chart_bar svg").remove();
  const bar_chart = d3
    .select('#calc_chart_bar')
    .append("svg")
    .attr("width", width)
    .attr("viewBox", [0, 0, width, height])
    .attr(
      "style",
      "max-width: 100%; height: auto;"
    );

  const barScale = d3.scaleLinear(
    [0, d3.max(chart_data, d => d.future_per_account)],
    [height - marginBottom, marginTop]
  );
  // y-axis
  bar_chart
    .append("g")
    .attr("transform", `translate(${width - marginRight - 8}, 0)`)
    .call(d3.axisRight(barScale).ticks(4).tickFormat(d3.format("$.2s")))
    .call((g) => g.select(".domain").remove())
    .call((g) =>
      g
        .selectAll(".tick line")
        .clone()
        .attr("x1", 0)
        .attr("x2", -width)
        .attr("stroke-opacity", 0.2)
    );

  const bars = bar_chart
    .append("g")
    .attr("id", "bars")

  const flue_bar = bars
    .append("rect")
    .attr('x', width - marginRight - 64 - 64 - 34 - 34)
    .attr('width', 64)
    .style('fill', "url(#flue_bar_gradient)")

  const future_bar = bars
    .append("rect")
    .attr('x', width - marginRight - 64 - 36)
    .attr('width', 64)
    .style('fill', "url(#future_bar_gradient)");

  const account_savings_movable = bar_chart
    .append("g")
    .attr("id", "account_savings_movable")

  const account_savings_txt = account_savings_movable
    .append("text")
    .attr("fill", "#FFFFFF")
    .attr("font-size", 36)
    .attr("font-weight", "bold")
    .attr("text-anchor", "start")
    .attr("x", marginLeft)
    .attr("style", `transform:rotate(-8deg)`);

  account_savings_movable
    .append("text")
    .attr("fill", "var(--violet)")
    .attr("font-size", 14)
    .attr("font-family", "Leaguemono")
    .attr("text-anchor", "start")
    .text("SAVINGS PER ACCOUNT")
    .attr("x", marginLeft)
    .attr("y", 24)
    .attr("style", `transform:rotate(-8deg)`)

  const account_count_txt = bar_chart
    .append("text")
    .attr("fill", "#FFF")
    .attr("font-size", 14)
    .attr("font-family", "Leaguemono")
    .attr("text-anchor", "middle")
    .attr("y", 16)
    .attr("x", width / 2)

  const position = (x, d, l) => {
    movables.attr("style", `transform:translateX(${x}px)`);
    fluency_circle
      .attr('cx', x)
      .attr('cy', y(d.fluency_monthly))
    future_circle
      .attr('cx', x)
      .attr('cy', y(d.future_monthly))

    growth_txt.text(`${d.growth}x`);

    savings_movable
      .attr("style", `transform:translateY(${y(d.future_monthly) + 16}px)`)
      .attr("text-anchor", l ? "end" : "start");

    savings_txt.text(d3.format("$.2s")(d.savings_per_month))

    account_savings_movable.attr("style", `transform:translateY(${barScale(d.fluency_per_account) - 32}px)`);
    account_savings_txt.text(d3.format("$.2s")(d.savings_per_account))
    account_count_txt.text(`${d.future_accounts} ACCOUNTS (${d.growth}x GROWTH)`)
    clipper.attr("width", x - marginLeft + 8);

    flue_bar
      .attr('y', barScale(d.fluency_per_account))
      .attr('height', barScale(0) - barScale(d.fluency_per_account))

    future_bar
      .attr('y', barScale(d.future_per_account))
      .attr('height', barScale(0) - barScale(d.future_per_account))

    // HTML labels
    future_asl.innerHTML = d3.format("$.2f")(d.future_per_account)
    fluency_asl.innerHTML = d3.format("$.2f")(d.fluency_per_account)
    future_sl.innerHTML = d3.format("$.2s")(d.future_monthly)
    fluency_sl.innerHTML = d3.format("$.2s")(d.fluency_monthly)

  }

  const X = x(old_growth);
  const current_data = chart_data.find(d => old_growth == d.growth);
  position(X, current_data, X > width / 2);

  line_chart.on("pointerdown", (e) => {
    line_chart.on("pointermove", (e) => {
      let parent = document.querySelector('#calc_chart');
      let bounds = parent.getBoundingClientRect();
      const { clientX } = e;
      const X = clientX - bounds.left;
      const isCursorOnRight = X > width / 2;
      let current_growth = xrev(X).toFixed(1)
      let current_data = chart_data.find(d => d.growth == current_growth);
      if (+X > marginLeft && +X < width - marginRight) {
        position(X, current_data, isCursorOnRight);
        old_growth = current_growth;
      }
    })
    document.addEventListener("pointerup", (e) => {
      line_chart.on('pointermove', null);
    })
  });
};

let range_data = {
  team_size: 60,
  team_salary: 95000,
  account_count: 600,
  account_spend: 5000,
};

const format = (v, i) => {
  let val = v
  switch (i) {
    case "team_salary":
      val = d3.format("$.2s")(val);
      break;
    case "account_spend":
      val = d3.format("$.2s")(val);
      break;
  }
  return val
}

const range_update = (r, o, i, a = false) => {
  let val = r.value
  let min = r.getAttribute('min');
  let max = r.getAttribute('max')

  o.value = format(val, i);
  range_data[i] = val
  let progress = ((val - min) / (max - min)) * 100;
  r.style.setProperty("--stop-1", `${progress * 0.19}%`);
  r.style.setProperty("--stop-2", `${progress * 0.895}%`);
  r.style.setProperty("--stop-3", `${progress}%`);

  if (a) {
    a.setAttribute("max", val * 30);
    const aco = document.querySelector("#account_count_output");
    range_update(a, aco, "account_count")

  }

  update_chart();
}

// browsers can be weird
const range_change = (r, o, i, a = false) => {
  let n, c, m;
  r.addEventListener("input", (e) => {
    n = 1;
    c = e.target.value;
    if (c != m) range_update(r, o, i, a)
    m = c;
  });
  r.addEventListener("change", (e) => {
    if (!n) range_update(r, o, i, a)
  });
}
// move them sliders
window.addEventListener('load', (e) => {
  // label dom elements
  future_asl = document.querySelector("#future_account_spend_label");
  fluency_asl = document.querySelector("#fluency_account_spend_label");
  future_sl = document.querySelector("#future_spend_label");
  fluency_sl = document.querySelector("#fluency_spend_label");

  const tcr = document.querySelector("#team_size_range");
  const tco = document.querySelector("#team_size_output");
  tcr.setAttribute("min", team_extent[0]);
  tcr.setAttribute("max", team_extent[1]);

  tcr.value = range_data.team_size;

  const tsr = document.querySelector("#team_salary_range");
  const tso = document.querySelector("#team_salary_output");
  tsr.setAttribute("min", salary_extent[0]);
  tsr.setAttribute("max", salary_extent[1]);

  tsr.value = range_data.team_salary;

  const acr = document.querySelector("#account_count_range");
  const aco = document.querySelector("#account_count_output");
  acr.setAttribute("min", account_extent[0]);
  acr.setAttribute("max", account_extent[1]);

  acr.value = range_data.account_count;

  const asr = document.querySelector("#account_spend_range");
  const aso = document.querySelector("#account_spend_output");
  asr.setAttribute("min", spend_extent[0]);
  asr.setAttribute("max", spend_extent[1]);
  asr.value = range_data.account_spend;

  range_change(tsr, tso, "team_salary");
  range_change(tcr, tco, "team_size", acr);
  range_change(acr, aco, "account_count");
  range_change(asr, aso, "account_spend");

  // init
  range_update(tsr, tso, "team_salary");
  range_update(acr, aco, "account_count");
  range_update(tcr, tco, "team_size");
  range_update(asr, aso, "account_spend");

});


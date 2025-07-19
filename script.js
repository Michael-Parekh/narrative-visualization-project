const width = 900;
const height = 500;
const margin = {top: 50, right: 50, bottom: 50, left: 80};
const svg = d3.select("#chart").append("svg")
              .attr("width", width)
              .attr("height", height);

let currentScene = 1;
let data;

d3.csv("covid-19-data.csv").then(raw => {
  data = raw.map(d => ({
    date: d3.timeParse("%Y-%m-%d")(d.Date),
    cases: +d.Cases,
    deaths: +d.Deaths,
    hospitalizations: +d.Hospitalizations,
    ageGroups: {
      "0-17": +d.Age_0_17,
      "18-29": +d.Age_18_29,
      "30-39": +d.Age_30_39,
      "40-49": +d.Age_40_49,
      "50-59": +d.Age_50_59,
      "60-69": +d.Age_60_69,
      "70-79": +d.Age_70_79,
      "80+": +d.Age_80_plus
    }
  }));
  setScene(1);
});

function setScene(scene) {
  currentScene = scene;
  svg.selectAll("*").remove();
  document.getElementById("description").textContent = "";
  if (scene === 1)  {
    drawOverview();
  } else if (scene === 2) { 
    drawAgeBarChart();
  } else if (scene === 3) {
    drawInteractive();
  }
}

function drawOverview() {
  document.getElementById("description").textContent = "Scene 1: Overall trends in cases, deaths, and hospitalizations over time.";
  const x = d3.scaleTime().domain(d3.extent(data, d => d.date)).range([margin.left, width - margin.right]);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.cases)]).nice().range([height - margin.bottom, margin.top]);

  const line = (key, color) => {
    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 2)
      .attr("d", d3.line().x(d => x(d.date)).y(d => y(d[key])));

    const latest = data[data.length - 1];
    svg.append("text")
      .attr("x", width - 130)
      .attr("y", y(latest[key]) - (key === "cases" ? 0 : key === "deaths" ? 20 : 40))
      .attr("fill", color)
      .style("font-size", "14px")
      .text(key.charAt(0).toUpperCase() + key.slice(1));
  };

  svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).ticks(8));
  svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));

  line("cases", "steelblue");
  line("deaths", "crimson");
  line("hospitalizations", "darkorange");

  svg.append("text")
    .attr("x", width/2)
    .attr("y", margin.top/2)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .text("Overview of COVID-19 in California");

  const importantDates = [
    { date: "2021-01-01", label: "Post-Holiday Surge" },
    { date: "2021-04-15", label: "Vaccine Eligibility Opens" },
    { date: "2021-07-15", label: "Delta Variant Spike" }
  ];

  importantDates.forEach((d, i) => {
    const date = d3.timeParse("%Y-%m-%d")(d.date);
    const closest = data.find(entry => entry.date >= date);
    if (!closest) return;

    const xPos = x(closest.date);
    const yPos = y(closest.cases);

    svg.append("rect")
      .attr("x", xPos + 5)
      .attr("y", yPos - 40 - i * 40)
      .attr("width", 150)
      .attr("height", 30)
      .attr("fill", "white")
      .attr("stroke", "#333")
      .attr("stroke-width", 0.5);

    svg.append("line")
      .attr("x1", xPos)
      .attr("x2", xPos + 5)
      .attr("y1", yPos)
      .attr("y2", yPos - 10 - i * 40)
      .attr("stroke", "#333")
      .attr("stroke-dasharray", "4 2");

    svg.append("text")
      .attr("x", xPos + 10)
      .attr("y", yPos - 20 - i * 40)
      .attr("fill", "#111")
      .style("font-size", "12px")
      .style("text-anchor", "start")
      .text(d.label);
  });
}

function drawAgeBarChart() {
  document.getElementById("description").textContent = "Scene 2: Cumulative COVID-19 cases by age group.";
  const ageSums = {};
  data.forEach(d => {
    for (const age in d.ageGroups) {
      ageSums[age] = (ageSums[age] || 0) + d.ageGroups[age];
    }
  });

  const ageData = Object.entries(ageSums).map(([age, val]) => ({ age, val }));

  const x = d3.scaleBand().domain(ageData.map(d => d.age)).range([margin.left, width - margin.right]).padding(0.2);
  const y = d3.scaleLinear().domain([0, d3.max(ageData, d => d.val)]).nice().range([height - margin.bottom, margin.top]);

  svg.append("g").selectAll("rect")
    .data(ageData)
    .join("rect")
    .attr("x", d => x(d.age))
    .attr("y", d => y(d.val))
    .attr("width", x.bandwidth())
    .attr("height", d => height - margin.bottom - y(d.val))
    .attr("fill", "teal");

  svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x));
  svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));

  svg.append("text")
    .attr("x", width/2)
    .attr("y", margin.top/2)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .text("Cumulative COVID-19 Cases by Age Group");
}

function drawInteractive() {
  document.getElementById("description").textContent = "Scene 3: Interactive exploration of daily COVID-19 case counts - hover over any data point to see more details.";
  const x = d3.scaleTime().domain(d3.extent(data, d => d.date)).range([margin.left, width - margin.right]);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.cases)]).nice().range([height - margin.bottom, margin.top]);

  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "seagreen")
    .attr("stroke-width", 2)
    .attr("d", d3.line().x(d => x(d.date)).y(d => y(d.cases)));

  svg.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => x(d.date))
    .attr("cy", d => y(d.cases))
    .attr("r", 3)
    .attr("fill", "seagreen")
    .on("mouseover", (event, d) => {
      const [xPos, yPos] = d3.pointer(event);
      svg.append("text")
        .attr("id", "tooltip")
        .attr("x", xPos + 10)
        .attr("y", yPos)
        .text(`Cases: ${d.cases.toLocaleString()} on ${d3.timeFormat("%b %d, %Y")(d.date)}`)
        .attr("fill", "black");
    })
    .on("mouseout", () => svg.select("#tooltip").remove());

  svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).ticks(8));
  svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));

  svg.append("text")
    .attr("x", width/2)
    .attr("y", margin.top/2)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .text("Interactive Exploration of Daily COVID-19 Cases");
}

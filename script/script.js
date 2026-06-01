
        Chart.defaults.color = "#ffffff";

        new Chart(
            document.getElementById("salesChart"),
            {
                type: "bar",
                data: {
                    labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
                    datasets: [{
                        label: "Ventas",
                        data: [120, 190, 300, 250, 420, 510],
                        backgroundColor: "#38bdf8"
                    }]
                }
            }
        );

        new Chart(
            document.getElementById("pieChart"),
            {
                type: "doughnut",
                data: {
                    labels: ["Desktop", "Móvil", "Tablet"],
                    datasets: [{
                        data: [65, 25, 10],
                        backgroundColor: [
                            "#38bdf8",
                            "#0ea5e9",
                            "#0284c7"
                        ]
                    }]
                }
            }
        );

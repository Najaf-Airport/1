// NajafFlightsApp/js/docx-export.js

const { Document, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, Packer, AlignmentType, BorderStyle, HeadingLevel } = docx;

// حقول الرحلة بترتيب العرض
const FLIGHT_HEADERS_AR = [
    "FLT.NO",
    "ON chocks Time",
    "Open Door Time",
    "Start Cleaning Time",
    "Complete Cleaning Time",
    "Ready Boarding Time",
    "Start Boarding Time",
    "Complete Boarding Time",
    "Close Door Time",
    "Off chocks Time",
    "الملاحظات"
];

const FLIGHT_FIELDS_ORDER = [
    "fltNo",
    "onChocksTime",
    "openDoorTime",
    "startCleaningTime",
    "completeCleaningTime",
    "readyBoardingTime",
    "startBoardingTime",
    "completeBoardingTime",
    "closeDoorTime",
    "offChocksTime",
    "notes"
];

/**
 * Creates a DOCX document for all flights in a given month, grouped by date.
 * @param {Array<Object>} flightsArray - An array of flight objects for the month.
 * @param {string} userName - The name of the logged-in user.
 * @param {string} monthName - The localized name of the month (e.g., "يوليو").
 * @param {string} year - The year (e.g., "2025").
 */
export async function exportMonthlyFlightsToDocx(flightsArray, userName, monthName, year) {
    const sections = [];

    sections.push({
        children: [
            new Paragraph({
                children: [
                    new TextRun({
                        text: `تقرير الرحلات الشهري لشهر ${monthName} لسنة ${year}`,
                        bold: true,
                        size: 36, // ~18pt
                        color: "2C3E50", // Dark Blue from CSS
                    }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
            }),
            new Paragraph({
                children: [
                    new TextRun({
                        text: `المستخدم: ${userName || 'غير معروف'}`,
                        bold: true,
                        size: 24, // ~12pt
                    }),
                ],
                alignment: AlignmentType.RIGHT,
                spacing: { after: 300 },
            }),
        ],
    });

    if (flightsArray.length === 0) {
        sections.push({
            children: [
                new Paragraph({
                    text: "لا توجد رحلات مسجلة لهذا الشهر.",
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 },
                    run: { color: "777777" }
                })
            ]
        });
    } else {
        // Group flights by date
        const flightsByDate = flightsArray.reduce((acc, flight) => {
            const date = flight.date; // assuming date is in YYYY-MM-DD format
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(flight);
            return acc;
        }, {});

        // Sort dates in descending order
        const sortedDates = Object.keys(flightsByDate).sort((a, b) => new Date(b) - new Date(a));

        sortedDates.forEach(date => {
            sections.push({
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `الرحلات بتاريخ: ${date}`,
                                bold: true,
                                size: 28, // ~14pt
                                color: "34495e", // From CSS flight card h4
                            }),
                        ],
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 400, after: 150 }, // Spacing before each date table
                    }),
                    createFlightTable(flightsByDate[date]),
                ],
            });
        });
    }

    sections.push({
        children: [
            new Paragraph({
                text: "",
                spacing: { before: 400 }, // Add some space before the footer text
            }),
            new Paragraph({
                children: [
                    new TextRun({
                        text: "تولدت بواسطة نظام إدارة الطائرات في مطار النجف الأشرف الدولي.",
                        size: 20, // ~10pt
                        color: "777777",
                    }),
                ],
                alignment: AlignmentType.CENTER,
            }),
        ],
    });

    const doc = new Document({
        sections: sections,
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `تقرير_رحلات_شهر_${monthName}_${year}_${userName}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Helper function to create a table for a list of flights.
 * @param {Array<Object>} flights - Array of flight objects for a specific date.
 * @returns {Table} DOCX Table object.
 */
function createFlightTable(flights) {
    const tableRows = [];

    // Header Row
    const headerCells = FLIGHT_HEADERS_AR.map(header => 
        new TableCell({
            children: [new Paragraph({ text: header, alignment: AlignmentType.CENTER, run: { bold: true } })],
            borders: {
                top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
            },
            shading: { fill: "F2F2F2" } // Light grey background for header
        })
    );
    tableRows.push(new TableRow({ children: headerCells, tableHeader: true }));

    // Data Rows
    flights.forEach(flight => {
        const dataCells = FLIGHT_FIELDS_ORDER.map(field => 
            new TableCell({
                children: [new Paragraph({ text: flight[field] || '', alignment: AlignmentType.CENTER })], // كل البيانات في الوسط
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "D3D3D3" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "D3D3D3" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "D3D3D3" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "D3D3D3" },
                }
            })
        );
        tableRows.push(new TableRow({ children: dataCells }));
    });

    return new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
            left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
            right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "D3D3D3" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "D3D3D3" },
        },
        columnWidths: Array(FLIGHT_HEADERS_AR.length).fill(100 / FLIGHT_HEADERS_AR.length * 9600) // Distribute width evenly
    });
}

// تم إزالة exportSingleFlightToDocx لأنها لم تعد تستخدم
// وتم إبقاء exportAdminDataToDocx مع ملاحظة أنها مهملة في هذا الإصدار
export async function exportAdminDataToDocx(type, data, filterMonth, filterUserEmail) {
    // ... (الكود القديم لهذه الدالة بدون تغيير)
    const [year, month] = filterMonth.split('-');
    const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "أيلول", "أكتوبر", "نوفمبر", "ديسمبر"];
    const monthName = monthNames[parseInt(month) - 1];

    let sections = [];
    let fileName = "";

    if (type === 'stats') {
        const { userFlightCounts, totalFlights, allUsersMap } = data;
        fileName = `إحصائيات_رحلات_${monthName}_${year}.docx`;

        sections.push({
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `إحصائيات الرحلات الشهرية لشهر ${monthName} لسنة ${year}`,
                            bold: true,
                            size: 36,
                            color: "2C3E50",
                        }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `العدد الكلي للرحلات: ${totalFlights}`,
                            bold: true,
                            size: 28,
                        }),
                    ],
                    alignment: AlignmentType.RIGHT,
                    spacing: { after: 200 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "إحصائيات المستخدمين:",
                            bold: true,
                            size: 26,
                        }),
                    ],
                    alignment: AlignmentType.RIGHT,
                    spacing: { after: 100 },
                }),
            ]
        });

        const userStatRows = Object.keys(userFlightCounts).sort((a, b) => {
            const nameA = allUsersMap.get(a) || '';
            const nameB = allUsersMap.get(b) || '';
            return nameA.localeCompare(nameB);
        }).map(userEmail => {
            const userName = allUsersMap.get(userEmail) || userEmail;
            const count = userFlightCounts[userEmail];
            return new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: userName, alignment: AlignmentType.RIGHT })] }),
                    new TableCell({ children: [new Paragraph({ text: count.toString(), alignment: AlignmentType.CENTER })] }),
                ]
            });
        }).filter(row => row !== null);

        if (userStatRows.length > 0) {
             sections.push({
                children: [
                    new Table({
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ text: "اسم المستخدم", alignment: AlignmentType.CENTER })] }),
                                    new TableCell({ children: [new Paragraph({ text: "عدد الرحلات", alignment: AlignmentType.CENTER })] }),
                                ],
                                tableHeader: true,
                            }),
                            ...userStatRows
                        ],
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                            insideHorizontal: { style: BorderStyle.SINGLE, size: 6, color: "D3D3D3" },
                            insideVertical: { style: BorderStyle.SINGLE, size: 6, color: "D3D3D3" },
                        }
                    })
                ]
            });
        }
    } else if (type === 'allFlights') {
        const { flightsToExport, usersStored } = data;
        const userDisplayName = filterUserEmail === 'all' ? 'الكل' : usersStored[filterUserEmail]?.name || filterUserEmail;
        fileName = `رحلات_تفصيلية_${userDisplayName}_${monthName}_${year}.docx`;

        sections.push({
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `تقرير الرحلات التفصيلي لشهر ${monthName} لسنة ${year} - ${userDisplayName}`,
                            bold: true,
                            size: 36,
                            color: "2C3E50",
                        }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 },
                }),
            ]
        });

        if (flightsToExport.length === 0) {
            sections.push({
                children: [
                    new Paragraph({
                        text: "لا توجد رحلات لتصديرها بالفلاتر المحددة.",
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 },
                        run: { color: "777777" }
                    })
                ]
            });
        } else {
            // هذه الدالة ستظل تعرض كل رحلة في جدول منفصل كما كانت تفعل، لأنها دالة "المسؤول" الأصلية.
            // الوظيفة المطلوبة لتجميع الرحلات حسب التاريخ ستكون في `exportMonthlyFlightsToDocx`
            // التي تم تحديثها أعلاه.
            flightsToExport.forEach((flight, index) => {
                sections.push({
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `--- الرحلة رقم ${index + 1} (${flight.userName || 'غير معروف'}) ---`,
                                    bold: true,
                                    size: 28,
                                    color: "34495e",
                                }),
                            ],
                            alignment: AlignmentType.RIGHT,
                            spacing: { before: 300, after: 100 },
                        }),
                        new Table({
                            rows: [
                                new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "التاريخ:", alignment: AlignmentType.RIGHT })] }), new TableCell({ children: [new Paragraph({ text: flight.date || 'N/A', alignment: AlignmentType.RIGHT })] })] }),
                                new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "رقم الرحلة (FLT.NO):", alignment: AlignmentType.RIGHT })] }), new TableCell({ children: [new Paragraph({ text: flight.fltNo || 'N/A', alignment: AlignmentType.RIGHT })] })] }),
                                new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "ON chocks Time:", alignment: AlignmentType.RIGHT })] }), new TableCell({ children: [new Paragraph({ text: flight.onChocksTime || 'N/A', alignment: AlignmentType.RIGHT })] })] }),
                                new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Open Door Time:", alignment: AlignmentType.RIGHT })] }), new TableCell({ children: [new Paragraph({ text: flight.openDoorTime || 'N/A', alignment: AlignmentType.RIGHT })] })] }),
                                new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Start Cleaning Time:", alignment: AlignmentType.RIGHT })] }), new TableCell({ children: [new Paragraph({ text: flight.startCleaningTime || 'N/A', alignment: AlignmentType.RIGHT })] })] }),
                                new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Complete Cleaning Time:", alignment: AlignmentType.RIGHT })] }), new TableCell({ children: [new Paragraph({ text: flight.completeCleaningTime || 'N/A', alignment: AlignmentType.RIGHT })] })] }),
                                new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Ready Boarding Time:", alignment: AlignmentType.RIGHT })] }), new TableCell({ children: [new Paragraph({ text: flight.readyBoardingTime || 'N/A', alignment: AlignmentType.RIGHT })] })] }),
                                new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Start Boarding Time:", alignment: AlignmentType.RIGHT })] }), new TableCell({ children: [new Paragraph({ text: flight.startBoardingTime || 'N/A', alignment: AlignmentType.RIGHT })] })] }),
                                new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Complete Boarding Time:", alignment: AlignmentType.RIGHT })] }), new TableCell({ children: [new Paragraph({ text: flight.completeBoardingTime || 'N/A', alignment: AlignmentType.RIGHT })] })] }),
                                new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Close Door Time:", alignment: AlignmentType.RIGHT })] }), new TableCell({ children: [new Paragraph({ text: flight.closeDoorTime || 'N/A', alignment: AlignmentType.RIGHT })] })] }),
                                new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Off chocks Time:", alignment: AlignmentType.RIGHT })] }), new TableCell({ children: [new Paragraph({ text: flight.offChocksTime || 'N/A', alignment: AlignmentType.RIGHT })] })] }),
                                new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "الملاحظات:", alignment: AlignmentType.RIGHT })] }), new TableCell({ children: [new Paragraph({ text: flight.notes || 'N/A', alignment: AlignmentType.RIGHT })] })] }),
                            ],
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            borders: {
                                top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                                bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                                left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                                right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                                insideHorizontal: { style: BorderStyle.SINGLE, size: 6, color: "D3D3D3" },
                                insideVertical: { style: BorderStyle.SINGLE, size: 6, color: "D3D3D3" },
                            }
                        })
                    ]
                });
            });
        }
    }

    const doc = new Document({
        sections: sections,
    });

    const blob = await Packer.toBlob(doc);

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

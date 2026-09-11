from app.models.route import Route

DEFAULT_ROUTES = [
    Route(id=1, origin="DEL", destination="BOM", route_code="DEL-BOM", origin_name="Delhi", destination_name="Mumbai", weight=0.16, base_price=4850.0, active=True),
    Route(id=2, origin="BOM", destination="DEL", route_code="BOM-DEL", origin_name="Mumbai", destination_name="Delhi", weight=0.16, base_price=4890.0, active=True),
    Route(id=3, origin="DEL", destination="BLR", route_code="DEL-BLR", origin_name="Delhi", destination_name="Bengaluru", weight=0.13, base_price=5420.0, active=True),
    Route(id=4, origin="BLR", destination="DEL", route_code="BLR-DEL", origin_name="Bengaluru", destination_name="Delhi", weight=0.13, base_price=5380.0, active=True),
    Route(id=5, origin="BOM", destination="BLR", route_code="BOM-BLR", origin_name="Mumbai", destination_name="Bengaluru", weight=0.11, base_price=3950.0, active=True),
    Route(id=6, origin="BLR", destination="BOM", route_code="BLR-BOM", origin_name="Bengaluru", destination_name="Mumbai", weight=0.11, base_price=3980.0, active=True),
    Route(id=7, origin="DEL", destination="HYD", route_code="DEL-HYD", origin_name="Delhi", destination_name="Hyderabad", weight=0.08, base_price=4650.0, active=True),
    Route(id=8, origin="HYD", destination="DEL", route_code="HYD-DEL", origin_name="Hyderabad", destination_name="Delhi", weight=0.08, base_price=4620.0, active=True),
    Route(id=9, origin="BOM", destination="MAA", route_code="BOM-MAA", origin_name="Mumbai", destination_name="Chennai", weight=0.08, base_price=4250.0, active=True),
    Route(id=10, origin="MAA", destination="BOM", route_code="MAA-BOM", origin_name="Chennai", destination_name="Mumbai", weight=0.07, base_price=4220.0, active=True),
]

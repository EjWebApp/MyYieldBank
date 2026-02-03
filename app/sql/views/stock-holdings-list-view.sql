CREATE VIEW stock_holdings_list_view AS
SELECT
    stock_holdings.holding_id,
    stock_holdings.name,
    stock_holdings.purchase_price,
    stock_holdings.purchase_date,
    stock_holdings.current_price,
    stock_holdings.current_date,
    stock_holdings.current_profit,
    stock_holdings.current_profit_rate,
    stock_holdings.hidden,
    stock_holdings.take_profit_rate,
    stock_holdings.stop_loss_rate
    stock_catalog.name as stock_name,
    stock_catalog.symbol as stock_symbol
    from stock_holdings
    join stock_catalog on stock_holdings.catalog_id = stock_catalog.catalog_id;
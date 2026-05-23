def calc_total_cash(n_500, n_200, n_100, n_50, n_20, n_10):
    return (
        (n_500 * 500) +
        (n_200 * 200) +
        (n_100 * 100) +
        (n_50  * 50)  +
        (n_20  * 20)  +
        (n_10  * 10)
    )

def calc_locker_cash(n_500, n_200, n_100):
    return (
        (n_500 * 500) +
        (n_200 * 200) +
        (n_100 * 100)
    )

def calc_change_float(n_50, n_20, n_10):
    return (
        (n_50 * 50) +
        (n_20 * 20) +
        (n_10 * 10)
    )

def calc_physical_cash_generated(total_cash_counted, morning_float):
    return total_cash_counted - morning_float

def calc_net_daily_sales(total_cash_counted, morning_float, upi_earnings, cash_purchases):
    physical_cash = calc_physical_cash_generated(total_cash_counted, morning_float)
    return physical_cash + upi_earnings + cash_purchases

def calc_total_investments(cash_purchases, prakash_total):
    return cash_purchases + prakash_total

def run_all_calculations(entry: dict, prakash_total: float = 0):
    n_500 = entry.get("n_500", 0)
    n_200 = entry.get("n_200", 0)
    n_100 = entry.get("n_100", 0)
    n_50  = entry.get("n_50",  0)
    n_20  = entry.get("n_20",  0)
    n_10  = entry.get("n_10",  0)

    total_cash_counted = calc_total_cash(n_500, n_200, n_100, n_50, n_20, n_10)
    locker_cash        = calc_locker_cash(n_500, n_200, n_100)
    change_float       = calc_change_float(n_50, n_20, n_10)
    net_daily_sales    = calc_net_daily_sales(
                            total_cash_counted,
                            entry.get("morning_float", 0),
                            entry.get("upi_earnings", 0),
                            entry.get("cash_purchases", 0)
                         )
    total_investments  = calc_total_investments(
                            entry.get("cash_purchases", 0),
                            prakash_total
                         )

    return {
        "total_cash_counted": round(total_cash_counted, 2),
        "locker_cash":        round(locker_cash, 2),
        "change_float":       round(change_float, 2),
        "net_daily_sales":    round(net_daily_sales, 2),
        "total_investments":  round(total_investments, 2),
    }
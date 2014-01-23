import logging
import sqlite3

dbname = "../db/shack.sqlite"

#================================================================================
# SQL
#================================================================================

sql_query_list_users = "SELECT * FROM USERS"
sql_query_list_user = "SELECT * FROM USERS WHERE UNAME = '%s'"

sql_query_list_friends = "SELECT * FROM USER_RELATIONS WHERE SRC_USER = '%s'"

sql_query_list_shares = "SELECT ASIN FROM SHARES WHERE UNAME = '%s'"
sql_query_list_share = "SELECT rowid, uname, asin, text FROM SHARES WHERE UNAME = '%s' AND ASIN = '%s'"
sql_insert_share = "INSERT INTO SHARES (uname, asin, text) VALUES ('%s','%s','%s')"

sql_query_product_exists = "SELECT COUNT(*) FROM PRODUCTS where asin = '%s'"
sql_insert_product = "INSERT INTO PRODUCTS (asin, url, imgurl, name) VALUES ('%s', '%s', '%s', '%s')"
sql_query_list_product = "SELECT * FROM PRODUCTS WHERE asin = '%s'";

#sql_insert_rec = "INSERT INTO RECOMMENDATIONS (RECOMMENDER, REQUESTEDASIN, RECOMMENDEDASIN) VALUES ('%s','%s','%s')"
sql_insert_rec = "INSERT INTO RECOMMENDATIONS (RECID , RECOMMENDER, RECOMMENDEDASIN, SHAREID) VALUES ('%s','%s','%s', %s)"
sql_query_rec = "SELECT COUNT(*) FROM RECOMMENDATIONS WHERE RECOMMENDER = '%s' and REQUESTEDASIN = '%s' and RECOMMENDEDASIN = '%s'"

#================================================================================
# FRIENDS
#================================================================================    
def get_friends(user):
    if user is None:
        logging.error("get_friends() received null value")
        
    user = user.strip().lower()
    
    logging.info("Fetching friends of user %s" % user)
    if len(user) == 0:
        logging.error("get_friends() received empty value")
        return {}
    else:
        cursor = get_db_connection().execute(sql_query_list_friends % user)
        friends = []
        for row in cursor:
            share = row_to_dict(cursor, row)
            friends.append(row[1])
  
        logging.info("Friends for user %s: %s" % (user, str(friends)))
        return friends
    


#================================================================================
# RECOMMENDATIONS
#================================================================================

def recommendation_exists(user, fromasin, toasin):
    cursor = get_db_connection().execute(sql_query_rec % (user, toasin, fromasin))
    row = cursor.fetchone()        
    logging.info("Recommendation exists: %s" % row[0])
    
    if row[0] >= 1:
        return True
    else:
        return False 
    


def add_recommendation(user, fromasin, shareid):
#    if recommendation_exists(user, fromasin, toasin) == True:
#        return

    try:
        logging.info("Adding recomendation %s for %s by %s." %(fromasin, shareid, user))
        sql = sql_insert_rec % ((user + "-" + str(shareid) + "-" + fromasin), user, fromasin, shareid)
        logging.info("Add recommendation sql: " + sql)
        con = get_db_connection()
        con.execute(sql)
        con.commit()    
        return True    
#        add_product(product)
#        add_product({'asin':fromasin, 'url':web.input()['url'], 'imgurl':web.input()['imgurl'], 'name':urllib.unquote(web.input()['product'])})

    except Exception, e:
        print e
        logging.error("Duplicate recommendation: %s, %s, %s" % (user, fromasin, shareid))
        return False
    
def get_recommendation_counts(shareid):
    logging.info("Getting recommendations count for shareid %s" % shareid)
    con = get_db_connection()

    try:
        c = con.execute("SELECT recommendedasin, count(*) as CNT FROM recommendations where shareid=%s group by recommendedasin" %shareid)
        
        results = []
        for r in c:
            d = row_to_dict(c, r)
            logging.info("Count of recommendations for asin %s for shareid %s: %s" % (d['recommendedasin'], shareid, d['CNT']))
            results.append(d)
            
        return results
    except Exception:
        logging.error("Failed to list counts of recommendations for share %s" % shareid)

    return []

#================================================================================
# UTIL
#================================================================================
def get_db_connection():
    return sqlite3.connect(dbname)

# Maps a sqlite row to a dictionary object, each key corresponding to column name
def row_to_dict(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]

    return d

#================================================================================
# PRODUCT
#================================================================================

def get_product(asin):
    if asin is None:
        logging.error("get_product() received null value")
        
    asin = asin.strip()
    
    logging.info("Fetching details of product %s" % asin)
    if len(asin) == 0:
        logging.error("get_product() received empty value")
        return {}
    else:
        if product_exists(asin):
            cursor = get_db_connection().execute(sql_query_list_product % asin)
            row = cursor.fetchone()        
            prod = row_to_dict(cursor, row)
            logging.info("Product details: %s" % prod)
            return prod
        else:
            return {}
        
def product_exists(asin):
    if asin is None:
        logging.error("product_exists() received null value")
        
    asin = asin.strip()
    
    logging.info("Checking if product with asin %s exists" % asin)
    if len(asin) == 0:
        logging.error("product_exists() received empty value")
        return {}
    else:
        cursor = get_db_connection().execute(sql_query_product_exists % asin)
        row = cursor.fetchone()        
        logging.info("Product exists: %s" % row[0])
        return row[0]

def add_product(product):
    
    asin = product['asin']
    url = product['url']
    imgurl = product['imgurl']
    name = product['name']
    
    if product_exists(asin) == 0:
        con = get_db_connection()

        name = name.replace("'", " ")
        con.execute(sql_insert_product % (asin, url, imgurl, name))
        con.commit()
    else:
        pass

    

#================================================================================
# USER
#================================================================================

def get_user(name):
    if name is None:
        logging.error("get_user() received null value")
        
    name = name.strip().lower()
    
    logging.info("Fetching details of user %s" % name)
    if len(name) == 0:
        logging.error("get_user() received empty value")
        return {}
    else:
        print sql_query_list_user % name
        cursor = get_db_connection().execute(sql_query_list_user % name)
        row = cursor.fetchone()
        
        if row is None:
            return None
        
        user = row_to_dict(cursor, row)
        logging.info("User details: %s" % user)
        return user
        
# Lists all users
def get_all_users():
    logging.info("Listing users")
    
    cursor = get_db_connection().execute(sql_query_list_users)
    users = {}
    
    for row in cursor:
        user = row_to_dict(cursor, row)
        users[user['uname']] = user

    return users    
    
#================================================================================
# SHARES
#================================================================================    

def get_shares(user):
    if user is None:
        logging.error("get_shares() received null value")
        
    user = user.strip().lower()
    
    logging.info("Fetching shares of user %s" % user)
    if len(user) == 0:
        logging.error("get_shares() received empty value")
        return {}
    else:
        cursor = get_db_connection().execute(sql_query_list_shares % user)
        shares = []
        for row in cursor:
            share = row_to_dict(cursor, row)
            shares.append(row[0])
  
        logging.info("Shares for user %s: %s" % (user, str(shares)))
        return shares

def get_share(user, asin):
    if user is None:
        logging.error("get_share() received null value")
        
    user = user.strip().lower()
    
    logging.info("Fetching share of user %s for asin %s" % (user,asin))
    if len(user) == 0:
        logging.error("get_shares() received empty value")
        return None
    else:
        logging.info("Get share sql: " + sql_query_list_share % (user, asin))
        cursor = get_db_connection().execute(sql_query_list_share % (user, asin))
    
        for row in cursor:
            share = row_to_dict(cursor, row)
  
            logging.info("Shares for user %s: %s" % (user, str(share)))
            return share

def add_share(user, asin, text):
    
    share = get_share(user, asin)
    
    if share is not None:
        logging.info("Share already exists for %s, %s" % (user, asin))
        return None
    
    sql_insert_share = "INSERT INTO SHARES (uname, asin, text) VALUES ('%s','%s','%s')"
    
    sql = sql_insert_share % (user, asin, text);

    con = get_db_connection()
    
    try:
        logging.info("Inserting share: " + sql)
        con.execute(sql)
        con.commit()
    except Exception:
        logging.error("Error while inserting share: %s, %s, %s" % (user, asin, share))
    
#================================================================================
# other....
#================================================================================    

if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)
    
    print get_recommendation_counts(45)
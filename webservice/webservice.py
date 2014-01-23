import web
import re
import json
import repo
import logging
import urllib
import requests
#import facebook

environment = 'TEST'

class User(object):
    def GET(self, name):        
        name = name.strip().lower()
        web.header('Content-Type', 'application/json')

        if len(name) == 0:
            logging.info("Listing all users.")
            users = repo.get_all_users( )
            jsonstr = json.dumps(users)
            return jsonstr
        else:            
            logging.info("Request to list user '" + name + "'")
            user = repo.get_user(name)
            jsonstr = json.dumps(user)
            return jsonstr
        
class Friends(object):
    def GET(self, name):        
        name = name.strip().lower()
        web.header('Content-Type', 'application/json')

        if len(name) == 0:
            logging.error("Can't finds relationships if you do not provide username.")
            return "{}"
        else:  
            logging.info("Request to list relationships of user '" + name + "'")
            user = repo.get_friends(name)
            jsonstr = json.dumps(user)
            return jsonstr

class Shares(object):
    def GET(self, name):
        web.header('Content-Type', 'application/json')
        
        print name
        parts = name.split('/')
        
        if len(parts) == 3:
            if parts[0] == "add":
                self.sendFacebookNotification()
                repo.add_product({'asin':parts[2], 'url':web.input()['url'], 'imgurl':web.input()['imgurl'], 'name':urllib.unquote(web.input()['product'])})
                repo.add_share(parts[1], parts[2], web.input()['sharetext'])
                return '{}'
            else:
                return json.dumps(repo.get_share(parts[1], parts[2]))
                
        else:
            return json.dumps(repo.get_shares(parts[0]))
            
    def sendFacebookNotification(self):
        if (environment == 'TEST'):
            logging.info( 'In Test Mode. Not sending facebook notification')
            print( 'In Test Mode. Not sending facebook notification')
            return
        TOKEN = '216276655191901|EevYd4yaUFsu9oL8iDiOkUAnvl8'
        FACEBOOK_USER_ID='659497539' # Facebook id of Amazon user requesting recommendation. current cesar's facebook id
        FACEBOOK_FRIENDS_USER_IDS=['678633180','544720577','501699567'] # Facebook id of friend replying to recommendation. You can get ids from http://findmyfacebookid.com/. Currenly dwai, bhupinder, wiktor

        #graph = facebook.GraphAPI(TOKEN)
        #profile = graph.get_object(FACEBOOK_USER_ID)

        for id in FACEBOOK_FRIENDS_USER_IDS:
            FRIEND_MESSAGE='Your friend @[%s] needs your recommendation. Help him out!' % (FACEBOOK_USER_ID)
            resp = requests.post('https://graph.facebook.com/%s/notifications?access_token=%s&href=path&template=%s'% (id, TOKEN, FRIEND_MESSAGE))
            logging.info(resp)

        USER_MESSAGE = 'You have created a new recommendation request. Access it here!'
        resp = requests.post('https://graph.facebook.com/%s/notifications?access_token=%s&href=path&template=%s'% (FACEBOOK_USER_ID, TOKEN, USER_MESSAGE))
        logging.info(resp)
        return


class Products(object):
    def GET(self, name):
        web.header('Content-Type', 'application/json')

        parts = name.split('/')
        
        if len(parts) == 1:
            return json.dumps(repo.get_product(name))
        else:
            if parts[0] == "add":
                print "Adding product: " + name                
                repo.add_product({'asin':parts[2], 'url':web.input()['url'], 'imgurl':web.input()['imgurl'], 'name':urllib.unquote(web.input()['product'])})
                
class Recommendations(object):
    def GET(self, name):
        web.header('Content-Type', 'application/json')
        
        parts = name.split('/')
            
        if len(parts) == 4:
            if parts[0].lower().strip() == "add":
                if self.add(parts[1], parts[2], parts[3]):
                    return '{ "status": "ok" }'                    
                else:
                    return '{ "status": "fail" }'                    
            else:
                return '{ "status": "fail" }'
        elif len(parts) == 2:
            if parts[0].lower().strip() == "count":
                print "Counting recommendations for shareid " + parts[1]
                return json.dumps(repo.get_recommendation_counts(int(parts[1])))
        else:
            return '{ "status": "fail" }'
    
    def add(self, user, fromasin, shareid):
        return repo.add_recommendation(user, fromasin, shareid)
    
urls = (
    '/user/(.*)', 'User',
    '/friends/(.*)', 'Friends',
    '/shares/(.*)', 'Shares',
    '/product/(.*)', 'Products',
    '/rec/(.*)', 'Recommendations'
    )

if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)
    web.application(urls, globals()).run()

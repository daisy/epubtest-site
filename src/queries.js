module.exports = {

    LOGIN: (email, password) => `mutation{
        authenticate(input:{email:"${email}", password:"${password}"}) {
              jwtToken
        }
    }`,

    TEMPORARY_TOKEN: email => `mutation {
        createTemporaryToken(input:{email:"${email}"}) {
            jwtToken
        }
    }`,

    SET_PASSWORD: (userId, newPassword) => `mutation {
        setPassword(input:{userId:${userId}, newPassword:"${newPassword}"}) {
            boolean
      }
    }`,

    USER_PROFILE: userId => `query {
        user (id: ${userId}) {
            name
            organization
            website
        }
    }`,

    USER_PROFILE_EXTENDED: userId => `query {
      user (id: ${userId}) {
        name
        login {
          email
        }
      }
    }`,

    USER_ANSWERSETS: userId => `query {
      getUserTestingEnvironments(userId: ${userId}){
        nodes {
          id
         readingSystem {
           name
           version
         }
         assistiveTechnology{
           name
           version
         }
         os {
           name
           version
         }
         device {
           name
           version
         }
         browser {
           name
           version
         }
         answerSetsByTestingEnvironmentId(
           condition:
           { userId: ${userId} }
         ) {
           nodes{
             id
             flag
             score
             testBook {
               title
               topic {id}
               lang {
                 id
                 label
               }
             }
           }
         }
       }
     }
     }`,

    TEST_BOOKS: `query {
      getLatestTestBooks{
        nodes{
          title
          topicId
          langId
          filename
          description
        }
      }
    }`,
    
    PUBLIC_RESULTS: `query {
      getPublishedTestingEnvironments{
        nodes {
          id
          readingSystem{
            name
            version
          }
          assistiveTechnology{
            name
            version
          }
          os{
            name
            version
          }
          device{
            name
            version
          }
          browser {
            name
            version
          }
          answerSetsByTestingEnvironmentId{
            nodes{
              score
              testBook{
                title
                topic {
                  id
                  order
                  type
                }  
              }
            }
          }
        }
      }
    }`,

    TOPICS: `query{
      topics(orderBy:ORDER_ASC){
        nodes{
          id
          order
          type
        }
      }
    }`,

    TESTING_ENVIRONMENT: id => `query{
      testingEnvironment(id:${id}) {
              id
              testedWithBraille
              testedWithScreenreader
              input
              readingSystem{
                name
                version
              }
              assistiveTechnology{
                name
                version
              }
              os{
                name
                version
              }
              browser{
                name
                version
              }
              device{
                name
                version
              }
              answerSetsByTestingEnvironmentId{
                nodes{
                  id
                  score
                  summary
                  flag
                  testBook{
                    title
                    filename
                    topic {
                      id
                      order
                      type
                    }  
                    version
                  }
                  answersByAnswerSetId{
                    nodes {
                       test {
                        testId
                        description
                        name
                      }
                      value
                      flag
                      notes
                      notesArePublic
                    }
                  }
                }
              }
            }
          }
        `,
        
        REQUESTS_FOR_ANSWERSETS: answerSets => `query{
          requests(filter:{answerSetId:{in:[${answerSets.map(a => `${a},`)}]}})
          {
            nodes {
              id
              type
              answerSetId
              created
            }
          }
        }
        `,

        ANSWER_SET: answerSetId => `query{
          answerSet(id: ${answerSetId}) {
            id
            summary
            userId
            flag
            score
            testingEnvironment {
              id
              readingSystem{
                name
                version
              }
              assistiveTechnology{
                name
                version
              }
              os{
                name
                version
              }
              device{
                name
                version
              }
              browser {
                name
                version
              }
            }
            testBook {
              title
              version
              lang {
                id
                label
              }
              topic {
                id
              }
            }
            answersByAnswerSetId {
              nodes{
                id
                test {
                  id
                  testId
                  description
                  name
                }
                value
                flag
                notes
                notesArePublic
            }
          }
        }
      }`,

      UPDATE_ANSWER_SET: (answerSetId, summary, answers) => {
        let passed = answers.filter(a=>a.value === 'PASS');
        let score = passed.length / answers.length * 100;
        let escquotes = s => {
          let noq = s.toString().replace(/"/g, '\\"');
          noq = noq
          .replace(/[\u2018\u2019]/g, "'")
          .replace(/[\u201C\u201D]/g, '\\"');
          
          return noq;
        }

        let rmquotes = s => {
          let noq = s.toString().replace(/"/g, '');
          noq = noq
          .replace(/[\u2018\u2019]/g, "")
          .replace(/[\u201C\u201D]/g, '');

          noq = noq.replace(/(\r\n|\n|\r)/gm," ");
          return noq;
        }

      return `mutation {
        updateAnswersetAndAnswers(
          input:{
            answerSetId:${answerSetId}, 
            summary:"${rmquotes(summary)}",
            answerIds:[${answers.map(a=>a.id)}]
            answerValues:[${answers.map(a=>a.value)}],
            notes:[${answers.map(a=>a.notes ? `"${rmquotes(a.notes)}"` : '""')}],
            notesArePublic:[${answers.map(a=>a.publishNotes === 'on' ? 'true' : 'false')}],
            score: "${score}"
          }){
          clientMutationId
        }
      }
      `},

      REQUESTS: `query{
        requests {
          nodes {
            id
            created
            answerSet{
              id
              score
              testingEnvironment {
                readingSystem {
                  name
                  version
                }
                assistiveTechnology {
                  name
                  version
                }
                os {
                  name
                  version
                }
              }
              user {
                name
              }
              testBook {
                topic {
                  id
                }
              }
            }
          }
        }
      }`,
      
      CREATE_REQUEST: answerSetId => `mutation {
        createRequest(input:{
          request: {
            type: PUBLISH,
            answerSetId:${answerSetId} 
          }}){
          clientMutationId
        }
      }
      `,

      PUBLISH_ANSWER_SET: answerSetId => `mutation {
          updateAnswerSet(input:{
              id: ${answerSetId},
              patch: {
                isPublic:true
              }
            })
            {
              clientMutationId
            }
        }`,

      DELETE_REQUEST: requestId => `mutation {
        deleteRequest(input:{
          id:${requestId}
        }){
          clientMutationId
        }
      }`,

      ALL_TESTING_ENVIRONMENTS: `query {
        testingEnvironments{
          nodes {
            id
           readingSystem {
             name
             version
           }
           assistiveTechnology{
             name
             version
           }
           os {
             name
             version
           }
           device {
             name
             version
           }
           browser {
             name
             version
           }
           answerSetsByTestingEnvironmentId {
             nodes{
               id
               flag
               score
               isPublic
               testBook {
                 title
                 topic {id}
                 lang {
                   id
                   label
                 }
               }
             }
           }
         }
       }
       }`,

       INACTIVE_USERS: `query {
        getInactiveUsers {
          nodes{
            id
            name
          }
        }
       }`,

       ACTIVE_USERS: `query {
        getActiveUsers {
          nodes{
            id
            name
          }
        }
      }`,

      INVITED_USERS: `query {
        invitations {
          nodes {
            user{
              id
              name
            }
            dateInvited
          }
        }
      }`
    
};

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { FriendsApiService } from '../Services/FriendsApiService';
import { KahlaUser } from '../Models/KahlaUser';
import { CacheService } from '../Services/CacheService';
import { switchMap, } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { Values } from '../values';
import { MessageService } from '../Services/MessageService';
import { TimerService } from '../Services/TimerService';
import { Request } from '../Models/Request';

@Component({
    templateUrl: '../Views/user.html',
    styleUrls: ['../Styles/menu.scss',
                '../Styles/button.scss',
                '../Styles/badge.scss']
})

export class UserComponent implements OnInit {
    public info: KahlaUser;
    public conversationId: number;
    public areFriends: boolean;
    public loadingImgURL = Values.loadingImgURL;
    public sentRequest: boolean;
    public pendingRequest: Request;

    constructor(
        private route: ActivatedRoute,
        private friendsApiService: FriendsApiService,
        private router: Router,
        public cacheService: CacheService,
        public messageService: MessageService,
        public timerService: TimerService,
    ) {
    }

    public ngOnInit(): void {
        this.route.params
            .pipe(switchMap((params: Params) => this.friendsApiService.UserDetail(params['id'])))
            .subscribe(response => {
                this.info = response.user;
                this.areFriends = response.areFriends;
                this.conversationId = response.conversationId;
                this.sentRequest = response.sentRequest;
                this.pendingRequest = response.pendingRequest;
                this.info.avatarURL = this.messageService.encodeProbeFileUrl(this.info.iconFilePath);
            });
    }

    public delete(id: string): void {
        Swal.fire({
            title: 'Are you sure to delete a friend?',
            type: 'warning',
            showCancelButton: true
        }).then((willDelete) => {
            if (willDelete.value) {
                this.friendsApiService.DeleteFriend(id)
                    .subscribe(response => {
                        Swal.fire('Success', response.message, 'success');
                        this.cacheService.updateConversation();
                        this.cacheService.updateFriends();
                        this.router.navigate(['/home']);
                    });
            }
        });
    }

    public request(id: string): void {
        this.friendsApiService.CreateRequest(id)
            .subscribe(response => {
                if (response.code === 0) {
                    Swal.fire('Success', response.message, 'success');
                    this.sentRequest = true;
                } else {
                    Swal.fire('Error', response.message, 'error');
                }
            });
    }

    public report(): void {
        Swal.fire({
            title: 'Report',
            input: 'textarea',
            inputPlaceholder: 'Type your reason here...',
            inputAttributes: {
                maxlength: '200'
            },
            confirmButtonColor: 'red',
            showCancelButton: true,
            confirmButtonText: 'Report'
          }).then((result) => {
            if (result.value) {
                if (result.value.length >= 5) {
                    this.friendsApiService.Report(this.info.id, result.value).subscribe(response => {
                        if (response.code === 0) {
                            Swal.fire('Success', response.message, 'success');
                        } else {
                            Swal.fire('Error', response.message, 'error');
                        }
                    }, () => {
                        Swal.fire('Error', 'Report error.', 'error');
                    });
                } else {
                    Swal.fire('Error', 'The reason\'s length should between five and two hundreds.', 'error');
                }
            }
          });
    }

    public accept(id: number): void {
        this.friendsApiService.CompleteRequest(id, true)
            .subscribe(r => {
                Swal.fire('Success', r.message, 'success');
                this.cacheService.updateRequests();
                this.cacheService.updateFriends();
                this.areFriends = true;
                this.pendingRequest = null;
                this.sentRequest = false;
            });
    }

    public decline(id: number): void {
        this.friendsApiService.CompleteRequest(id, false)
            .subscribe(r => {
                Swal.fire('Success', r.message, 'success');
                this.cacheService.updateRequests();
                this.sentRequest = false;
                this.pendingRequest = null;
            });
    }

    public shareUser() {
        this.router.navigate(['/share-target', {message: `[user]${this.info.id}`}]);
    }
}

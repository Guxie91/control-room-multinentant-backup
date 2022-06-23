import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Component, Input, OnInit } from '@angular/core';
import { EtsiMessage } from 'src/app/models/etsi-message.model';

@Component({
  selector: 'app-event-details',
  templateUrl: './event-details.component.html',
  styleUrls: ['./event-details.component.css'],
})
export class EventDetailsComponent implements OnInit {
  @Input() event!: EtsiMessage;
  payloadJSON:any;

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit(): void {
    this.payloadJSON = JSON.parse(this.event.originalPayload);
  }
}
